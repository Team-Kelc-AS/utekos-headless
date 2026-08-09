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
    customer: z.object({ id: z.string().min(1) }).nullable(),
    lineItems: z.object({
      nodes: z.array(
        z.object({
          title: z.string().min(1).nullable(),
          product: z.object({ id: z.string().min(1) }).nullable(),
          image: z
            .object({
              url: z.string().url(),
              altText: z.string().nullable(),
              width: z.number().int().positive(),
              height: z.number().int().positive()
            })
            .nullable()
        })
      ),
      pageInfo: z.object({ hasNextPage: z.boolean() })
    })
  })
})

const DiscountSchema = z.object({
  codeDiscount: z.object({
    __typename: z.string(),
    status: z.enum(['ACTIVE', 'EXPIRED', 'SCHEDULED']).optional(),
    discountClasses: z
      .array(z.enum(['ORDER', 'PRODUCT', 'SHIPPING']))
      .optional(),
    appliesOncePerCustomer: z.boolean().optional(),
    appliesOnOneTimePurchase: z.boolean().optional(),
    appliesOnSubscription: z.boolean().optional(),
    combinesWith: z.object({
      orderDiscounts: z.boolean(),
      productDiscounts: z.boolean(),
      shippingDiscounts: z.boolean()
    }).optional()
  }).nullable()
}).nullable()

const ResponseSchema = z.object({
  abandonmentByAbandonedCheckoutId: AbandonmentSchema.nullable(),
  codeDiscountNodeByCode: DiscountSchema
})

export const SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY = `#graphql
  query AbandonedCheckoutRecoveryPreSend(
    $abandonedCheckoutId: ID!
    $discountCode: String!
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
        lineItems(first: 250) {
          nodes {
            title
            product {
              id
            }
            image {
              url
              altText
              width
              height
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    }
    codeDiscountNodeByCode(code: $discountCode) {
      codeDiscount {
        __typename
        ... on DiscountCodeApp {
          status
          discountClasses
          appliesOncePerCustomer
          appliesOnOneTimePurchase
          appliesOnSubscription
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
        }
      }
    }
  }
`

export async function fetchShopifyAbandonedCheckoutPreSendState(input: {
  abandonedCheckoutId: string
  comfyrobeProductId: string
  executeAdminGraphql: ShopifyAdminGraphqlExecutor
}): Promise<ShopifyAbandonedCheckoutPreSendState> {
  let parsed: z.infer<typeof ResponseSchema>

  try {
    const response = await input.executeAdminGraphql({
      query: SHOPIFY_ABANDONED_CHECKOUT_PRE_SEND_QUERY,
      variables: {
        abandonedCheckoutId: input.abandonedCheckoutId,
        discountCode: 'STAYCOMFY'
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
  const checkoutLines = checkout.lineItems.nodes
  const email = abandonment.customer.defaultEmailAddress
  const discount = parsed.codeDiscountNodeByCode?.codeDiscount
  const staycomfyDiscountActive =
    discount?.__typename === 'DiscountCodeApp' &&
    discount.status === 'ACTIVE' &&
    discount.appliesOncePerCustomer === true &&
    discount.appliesOnOneTimePurchase === true &&
    discount.appliesOnSubscription === false &&
    discount.combinesWith?.orderDiscounts === false &&
    discount.combinesWith.productDiscounts === false &&
    discount.combinesWith.shippingDiscounts === false &&
    discount.discountClasses?.includes('PRODUCT') === true &&
    discount.discountClasses.includes('SHIPPING') === true
  const comfyrobeLine = checkoutLines.find(
    line => line.product?.id === input.comfyrobeProductId
  )
  const imageLine =
    comfyrobeLine?.image ? comfyrobeLine
    : checkoutLines.find(line => line.image !== null)
  const productImage =
    imageLine?.image ?
      {
        url: imageLine.image.url,
        alt:
          imageLine.image.altText?.trim() ||
          imageLine.title?.trim() ||
          'Produkt fra Utekos'
      }
    : null

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
    staycomfyDiscountActive,
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
      recoveryUrl: checkout.abandonedCheckoutUrl,
      containsComfyrobe:
        checkoutLines.some(
          line => line.product?.id === input.comfyrobeProductId
        ),
      productImage
    }
  }
}
