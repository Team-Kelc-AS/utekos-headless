import { z } from 'zod'

import { reconcileShopifyNativeAbandonment } from '@/lib/commerce/checkoutSession/reconcileShopifyCheckoutAttempt'

import type { ShopifyAdminGraphqlExecutor } from './fetchShopifyAbandonedCheckoutRecoveryCandidates'

import type { ShopifyAbandonedCheckoutPreSendState } from './authorizeAbandonedCheckoutRecoverySend'

const BEGIN_CHECKOUT_EVENT_ATTRIBUTE =
  'utekos_begin_checkout_event_id'

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

const CheckoutAttributeSchema = z.object({
  key: z.string().min(1),

  value: z.string()
})

const ShopMoneySchema = z.object({
  amount: z.string().min(1),

  currencyCode: z.string().min(1)
})

const LineItemNodeSchema = z.object({
  title: z.string().min(1),

  quantity: z.number().int().positive(),

  variantTitle: z.string().min(1).nullable(),

  discountedTotalPriceSet: z.object({
    shopMoney: ShopMoneySchema
  }),

  product: z
    .object({
      handle: z.string().min(1)
    })
    .nullable()
})

const AbandonmentSchema = z.object({
  id: z.string().min(1),

  createdAt: z.string().min(1),

  /*
   * Optional/defaulted for compatibility with
   * existing test fixtures and older mocked
   * Shopify responses.
   *
   * The production GraphQL query below requests
   * the field explicitly.
   */
  mostRecentStep: z
    .enum(['BROWSE', 'CART', 'CHECKOUT'])
    .nullable()
    .optional()
    .default(null),

  customerHasNoDraftOrderSinceAbandonment: z.boolean(),

  customerHasNoOrderSinceAbandonment: z.boolean(),

  emailSentAt: z.string().min(1).nullable(),

  emailState: z
    .enum(['NOT_SENT', 'SCHEDULED', 'SENT'])
    .nullable(),

  inventoryAvailable: z.boolean(),

  isMostSignificantAbandonment: z.boolean(),

  customer: z.object({
    id: z.string().min(1),

    defaultEmailAddress: CustomerEmailSchema.nullable()
  }),

  abandonedCheckoutPayload: z.object({
    id: z.string().min(1),

    createdAt: z.string().min(1),

    updatedAt: z.string().min(1),

    completedAt: z.string().min(1).nullable(),

    abandonedCheckoutUrl: z.string().min(1),

    /*
     * Same compatibility rule as mostRecentStep:
     * production requests this field, while
     * historical unit fixtures may omit it.
     */
    customAttributes: z
      .array(CheckoutAttributeSchema)
      .optional()
      .default([]),

    customer: z.object({ id: z.string().min(1) }).nullable(),

    lineItems: z.object({
      nodes: z.array(LineItemNodeSchema),

      pageInfo: z.object({
        hasNextPage: z.boolean()
      })
    })
  })
})

const ResponseSchema = z.object({
  abandonmentByAbandonedCheckoutId: AbandonmentSchema.nullable()
})

export const SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY = `#graphql
  query AbandonedCheckoutRecoveryPreSend(
    $abandonedCheckoutId: ID!
  ) {
    abandonmentByAbandonedCheckoutId(
      abandonedCheckoutId: $abandonedCheckoutId
    ) {
      id
      createdAt
      mostRecentStep
      customerHasNoDraftOrderSinceAbandonment
      customerHasNoOrderSinceAbandonment
      emailSentAt
      emailState
      inventoryAvailable
      isMostSignificantAbandonment
      customer {
        id
        defaultEmailAddress {
          emailAddress
          marketingState
          validFormat
        }
      }
      abandonedCheckoutPayload {
        id
        createdAt
        updatedAt
        completedAt
        abandonedCheckoutUrl
        customAttributes {
          key
          value
        }
        customer {
          id
        }
        lineItems(first: 10) {
          nodes {
            title
            quantity
            variantTitle
            discountedTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            product {
              handle
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
  }
`

function resolveBeginCheckoutEventId(
  attributes: readonly z.infer<typeof CheckoutAttributeSchema>[]
): string | null {
  const matchingAttributes = attributes.filter(
    attribute => attribute.key === BEGIN_CHECKOUT_EVENT_ATTRIBUTE
  )

  if (matchingAttributes.length === 0) {
    return null
  }

  const values = new Set<string>()

  for (const attribute of matchingAttributes) {
    const parsed = z.string().uuid().safeParse(attribute.value)

    /*
     * Fail closed on an invalid duplicate/malformed
     * value rather than choosing whichever matching
     * attribute happened to be returned first.
     */
    if (!parsed.success) {
      return null
    }

    values.add(parsed.data)
  }

  if (values.size !== 1) {
    return null
  }

  return values.values().next().value ?? null
}

function resolveVariantTitle(
  variantTitle: string | null
): string | null {
  if (variantTitle === null) {
    return null
  }

  const trimmed = variantTitle.trim()

  if (
    trimmed.length === 0
    || trimmed.toLocaleLowerCase('nb-NO') === 'default title'
  ) {
    return null
  }

  return trimmed
}

function toCheckoutLineItems(
  lineItems: z.infer<typeof LineItemNodeSchema>[]
): ShopifyAbandonedCheckoutPreSendState['checkout']['lineItems'] {
  return lineItems.map(lineItem => ({
    title: lineItem.title.trim(),
    quantity: lineItem.quantity,
    variantTitle: resolveVariantTitle(lineItem.variantTitle),
    priceAmount: lineItem.discountedTotalPriceSet.shopMoney.amount,
    priceCurrencyCode:
      lineItem.discountedTotalPriceSet.shopMoney.currencyCode,
    productHandle: lineItem.product?.handle ?? null
  }))
}

async function safelyReconcileNativeAbandonment(input: {
  requestedAbandonedCheckoutId: string

  abandonment: z.infer<typeof AbandonmentSchema>
}): Promise<void> {
  const checkout = input.abandonment.abandonedCheckoutPayload

  /*
   * abandonmentByAbandonedCheckoutId is authoritative,
   * but do not mutate Registry if Shopify returns a
   * payload identity different from the ID we requested.
   *
   * The existing authorization path will independently
   * reject that identity mismatch later.
   */
  if (checkout.id !== input.requestedAbandonedCheckoutId) {
    return
  }

  const beginCheckoutEventId = resolveBeginCheckoutEventId(
    checkout.customAttributes
  )

  if (!beginCheckoutEventId) {
    return
  }

  try {
    await reconcileShopifyNativeAbandonment({
      beginCheckoutEventId,

      abandonedCheckoutId: checkout.id,

      recoveryUrl: checkout.abandonedCheckoutUrl,

      createdAt: checkout.createdAt,

      updatedAt: checkout.updatedAt,

      completedAt: checkout.completedAt,

      mostRecentStep: input.abandonment.mostRecentStep,

      inventoryAvailable: input.abandonment.inventoryAvailable,

      nativeEmailState: input.abandonment.emailState,

      customerHasNoOrderSinceAbandonment:
        input.abandonment.customerHasNoOrderSinceAbandonment,

      customerHasNoDraftOrderSinceAbandonment:
        input.abandonment.customerHasNoDraftOrderSinceAbandonment
    })
  } catch {
    /*
     * Registry enrichment must never make the
     * existing abandoned-checkout recovery
     * revalidation fail.
     *
     * The current recovery worker remains controlled
     * by its existing Shopify authorization checks.
     *
     * Deliberately no raw URL/customer/token/error
     * logging here.
     */
  }
}

export async function fetchShopifyAbandonedCheckoutPreSendState(input: {
  abandonedCheckoutId: string

  executeAdminGraphql: ShopifyAdminGraphqlExecutor
}): Promise<ShopifyAbandonedCheckoutPreSendState> {
  let parsed: z.infer<typeof ResponseSchema>

  try {
    const response = await input.executeAdminGraphql({
      query: SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY,

      variables: {
        abandonedCheckoutId: input.abandonedCheckoutId
      }
    })

    parsed = ResponseSchema.parse(response)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        'abandoned_checkout_recovery_shopify_state_missing'
    ) {
      throw error
    }

    throw new Error(
      'abandoned_checkout_recovery_shopify_state_invalid'
    )
  }

  const abandonment = parsed.abandonmentByAbandonedCheckoutId

  if (!abandonment) {
    throw new Error(
      'abandoned_checkout_recovery_shopify_state_missing'
    )
  }

  const checkout = abandonment.abandonedCheckoutPayload
  const beginCheckoutEventId = resolveBeginCheckoutEventId(
    checkout.customAttributes
  )

  if (checkout.lineItems.pageInfo.hasNextPage) {
    throw new Error(
      'abandoned_checkout_recovery_shopify_state_invalid'
    )
  }

  const lineItems = toCheckoutLineItems(checkout.lineItems.nodes)

  if (lineItems.some(lineItem => lineItem.title.length === 0)) {
    throw new Error(
      'abandoned_checkout_recovery_shopify_state_invalid'
    )
  }

  const email = abandonment.customer.defaultEmailAddress

  /*
   * This is intentionally best-effort and happens
   * only after strict Shopify response parsing.
   *
   * It does not authorize the email. The existing
   * authorizeAbandonedCheckoutRecoverySend() path
   * remains the sole pre-send authorization gate.
   */
  await safelyReconcileNativeAbandonment({
    requestedAbandonedCheckoutId: input.abandonedCheckoutId,

    abandonment
  })

  return {
    abandonmentId: abandonment.id,

    createdAt: abandonment.createdAt,

    customerHasNoDraftOrderSinceAbandonment:
      abandonment.customerHasNoDraftOrderSinceAbandonment,

    customerHasNoOrderSinceAbandonment:
      abandonment.customerHasNoOrderSinceAbandonment,

    emailSentAt: abandonment.emailSentAt,

    emailState: abandonment.emailState,

    inventoryAvailable: abandonment.inventoryAvailable,

    isMostSignificantAbandonment:
      abandonment.isMostSignificantAbandonment,

    customer: {
      id: abandonment.customer.id,

      email:
        email ?
          {
            address: email.emailAddress,

            marketingState: email.marketingState,

            validFormat: email.validFormat
          }
        : null
    },

    checkout: {
      id: checkout.id,

      ...(beginCheckoutEventId ?
        {
          beginCheckoutEventId,
          checkoutEmailMarketingAccepted: false
        }
      : {}),

      customerId: checkout.customer?.id ?? null,

      createdAt: checkout.createdAt,

      updatedAt: checkout.updatedAt,

      completedAt: checkout.completedAt,

      recoveryUrl: checkout.abandonedCheckoutUrl,

      lineItems
    }
  }
}
