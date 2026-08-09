import { z } from 'zod'

import type { ShopifyAdminGraphqlExecutor } from './fetchShopifyAbandonedCheckoutRecoveryCandidates'
import type { ShopifyAbandonedCheckoutPreSendState } from './authorizeAbandonedCheckoutRecoverySend'

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

const AbandonmentSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
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
    customer: z.object({ id: z.string().min(1) }).nullable()
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
        customer {
          id
        }
      }
    }
  }
`

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
  const email = abandonment.customer.defaultEmailAddress

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
      customerId: checkout.customer?.id ?? null,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
      completedAt: checkout.completedAt,
      recoveryUrl: checkout.abandonedCheckoutUrl
    }
  }
}
