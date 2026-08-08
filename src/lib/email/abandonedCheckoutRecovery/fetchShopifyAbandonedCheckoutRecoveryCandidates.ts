import { z } from 'zod'

import {
  ABANDONED_CHECKOUT_RECOVERY_WINDOW_MS,
  type ShopifyAbandonedCheckoutRecoveryCandidate
} from './abandonedCheckoutRecovery'

const SHOPIFY_PAGE_SIZE = 50
const MAX_SHOPIFY_PAGES = 200

const CustomerEmailSchema = z.object({
  emailAddress: z.string().min(1),
  marketingState: z.enum([
    'INVALID',
    'NOT_SUBSCRIBED',
    'PENDING',
    'SUBSCRIBED',
    'UNSUBSCRIBED'
  ]),
  validFormat: z.boolean()
})

const AbandonedCheckoutNodeSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  completedAt: z.string().min(1).nullable(),
  customer: z
    .object({
      id: z.string().min(1),
      numberOfOrders: z.union([
        z.string(),
        z.number()
      ]),
      defaultEmailAddress:
        CustomerEmailSchema.nullable()
    })
    .nullable()
})

const AbandonedCheckoutsDataSchema = z.object({
  abandonedCheckouts: z.object({
    nodes: z.array(
      AbandonedCheckoutNodeSchema
    ),
    pageInfo: z.object({
      hasNextPage: z.boolean(),
      endCursor: z.string().nullable()
    })
  })
})

const GraphqlEnvelopeSchema = z.object({
  data:
    AbandonedCheckoutsDataSchema
      .nullable()
      .optional(),
  errors: z
    .array(
      z
        .object({
          message: z.string().min(1)
        })
        .passthrough()
    )
    .optional()
})

export const SHOPIFY_ABANDONED_CHECKOUT_RECOVERY_QUERY = `#graphql
  query AbandonedCheckoutRecoveryCandidates(
    $first: Int!
    $after: String
    $query: String!
  ) {
    abandonedCheckouts(
      first: $first
      after: $after
      query: $query
    ) {
      nodes {
        id
        createdAt
        updatedAt
        completedAt
        customer {
          id
          numberOfOrders
          defaultEmailAddress {
            emailAddress
            marketingState
            validFormat
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export type ShopifyAdminGraphqlExecutor = (
  request: {
    query: string
    variables: Record<string, unknown>
  }
) => Promise<unknown>

type FetchShopifyAbandonedCheckoutRecoveryCandidatesInput = {
  executeAdminGraphql: ShopifyAdminGraphqlExecutor
  now?: Date
  windowMs?: number
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function unwrapGraphqlData(
  value: unknown
): z.infer<typeof AbandonedCheckoutsDataSchema> {
  if (
    isRecord(value) &&
    (
      'data' in value ||
      'errors' in value
    )
  ) {
    const envelope =
      GraphqlEnvelopeSchema.parse(value)

    if (envelope.errors?.length) {
      throw new Error(
        `Shopify Admin GraphQL failed: ${
          envelope.errors
            .map(error => error.message)
            .join('; ')
        }`
      )
    }

    if (!envelope.data) {
      throw new Error(
        'Shopify Admin GraphQL returned no data'
      )
    }

    return envelope.data
  }

  return AbandonedCheckoutsDataSchema.parse(
    value
  )
}

function parseOrderCount(
  value: string | number
): number {
  const numericValue =
    typeof value === 'number' ?
      value
    : Number(value)

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < 0
  ) {
    throw new Error(
      `Invalid Shopify customer numberOfOrders: ${String(value)}`
    )
  }

  return numericValue
}

function assertValidDate(
  date: Date,
  fieldName: string
): void {
  if (!Number.isFinite(date.getTime())) {
    throw new Error(
      `Invalid ${fieldName}`
    )
  }
}

function toCandidate(
  node: z.infer<
    typeof AbandonedCheckoutNodeSchema
  >
): ShopifyAbandonedCheckoutRecoveryCandidate {
  const customer = node.customer

  return {
    checkoutId:
      node.id,
    customerId:
      customer?.id ?? null,
    createdAt:
      node.createdAt,
    updatedAt:
      node.updatedAt,
    completedAt:
      node.completedAt,
    numberOfOrders:
      customer ?
        parseOrderCount(
          customer.numberOfOrders
        )
      : null,
    email:
      customer?.defaultEmailAddress ?
        {
          address:
            customer.defaultEmailAddress
              .emailAddress,
          marketingState:
            customer.defaultEmailAddress
              .marketingState,
          validFormat:
            customer.defaultEmailAddress
              .validFormat
        }
      : null
  }
}

export function buildShopifyAbandonedCheckoutRecoverySearchQuery(
  cutoff: Date
): string {
  assertValidDate(
    cutoff,
    'Shopify abandoned checkout cutoff'
  )

  return [
    `created_at:>='${cutoff.toISOString()}'`,
    'recovery_state:not_recovered'
  ].join(' ')
}

export async function fetchShopifyAbandonedCheckoutRecoveryCandidates(
  {
    executeAdminGraphql,
    now = new Date(),
    windowMs =
      ABANDONED_CHECKOUT_RECOVERY_WINDOW_MS
  }: FetchShopifyAbandonedCheckoutRecoveryCandidatesInput
): Promise<
  ShopifyAbandonedCheckoutRecoveryCandidate[]
> {
  assertValidDate(
    now,
    'now'
  )

  if (
    !Number.isSafeInteger(windowMs) ||
    windowMs <= 0
  ) {
    throw new Error(
      'windowMs must be a positive safe integer'
    )
  }

  const cutoff = new Date(
    now.getTime() - windowMs
  )

  const searchQuery =
    buildShopifyAbandonedCheckoutRecoverySearchQuery(
      cutoff
    )

  const byCheckoutId = new Map<
    string,
    ShopifyAbandonedCheckoutRecoveryCandidate
  >()

  let after: string | null = null

  for (
    let page = 0;
    page < MAX_SHOPIFY_PAGES;
    page += 1
  ) {
    const rawResponse =
      await executeAdminGraphql({
        query:
          SHOPIFY_ABANDONED_CHECKOUT_RECOVERY_QUERY,
        variables: {
          first:
            SHOPIFY_PAGE_SIZE,
          after,
          query:
            searchQuery
        }
      })

    const data =
      unwrapGraphqlData(rawResponse)

    const connection =
      data.abandonedCheckouts

    for (
      const node of connection.nodes
    ) {
      const candidate =
        toCandidate(node)

      byCheckoutId.set(
        candidate.checkoutId,
        candidate
      )
    }

    if (
      !connection.pageInfo.hasNextPage
    ) {
      return [
        ...byCheckoutId.values()
      ]
    }

    if (
      !connection.pageInfo.endCursor
    ) {
      throw new Error(
        'Shopify abandonedCheckouts reported hasNextPage without endCursor'
      )
    }

    after =
      connection.pageInfo.endCursor
  }

  throw new Error(
    `Shopify abandonedCheckouts exceeded ${MAX_SHOPIFY_PAGES} pages`
  )
}