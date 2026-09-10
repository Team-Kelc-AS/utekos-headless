import { z } from 'zod'

import {
  shopifyAdminGraphql
} from '@/lib/shopify/shopifyAdminGraphql'

const httpsUrlSchema = z.string().url().max(4096).refine(value => {
  const url = new URL(value)
  return url.protocol === 'https:'
    && url.username === ''
    && url.password === ''
})

const moneySchema = z.strictObject({
  amount: z.string().regex(/^-?[0-9]+(?:\.[0-9]+)?$/u),
  currencyCode: z.string().regex(/^[A-Z]{3}$/u)
})

const imageSchema = z.strictObject({
  url: httpsUrlSchema,
  altText: z.string().max(500).nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable()
})

const lineItemSchema = z.strictObject({
  id: z.string().regex(/^gid:\/\/shopify\/LineItem\/[1-9][0-9]{0,19}$/u),
  title: z.string().trim().min(1).max(500),
  name: z.string().trim().min(1).max(500),
  quantity: z.number().int().min(0).max(9999),
  variantTitle: z.string().trim().max(500).nullable(),
  image: imageSchema.nullable(),
  originalUnitPriceSet: z.strictObject({
    presentmentMoney: moneySchema
  }),
  discountedTotalSet: z.strictObject({
    presentmentMoney: moneySchema
  })
})

const orderSchema = z.strictObject({
  id: z.string().regex(/^gid:\/\/shopify\/Order\/[1-9][0-9]{0,19}$/u),
  legacyResourceId: z.union([z.string(), z.number()]).transform(String),
  name: z.string().trim().min(1).max(100),
  createdAt: z.string().datetime({ offset: true }),
  cancelledAt: z.string().datetime({ offset: true }).nullable(),
  email: z.string().trim().toLowerCase().email().max(320).nullable(),
  canNotifyCustomer: z.boolean(),
  statusPageUrl: httpsUrlSchema,
  currentTotalPriceSet: z.strictObject({
    presentmentMoney: moneySchema
  }),
  lineItems: z.strictObject({
    nodes: z.array(lineItemSchema).max(100),
    pageInfo: z.strictObject({
      hasNextPage: z.boolean(),
      endCursor: z.string().nullable()
    })
  })
})

const responseSchema = z.strictObject({
  order: orderSchema.nullable()
})

export type ShopifyTransactionalEmailOrder = z.infer<
  typeof orderSchema
>

export const SHOPIFY_TRANSACTIONAL_EMAIL_ORDER_QUERY = `#graphql
  query ShopifyTransactionalEmailOrder($id: ID!) {
    order(id: $id) {
      id
      legacyResourceId
      name
      createdAt
      cancelledAt
      email
      canNotifyCustomer
      statusPageUrl
      currentTotalPriceSet {
        presentmentMoney {
          amount
          currencyCode
        }
      }
      lineItems(first: 100) {
        nodes {
          id
          title
          name
          quantity
          variantTitle
          image {
            url
            altText
            width
            height
          }
          originalUnitPriceSet {
            presentmentMoney {
              amount
              currencyCode
            }
          }
          discountedTotalSet(withCodeDiscounts: true) {
            presentmentMoney {
              amount
              currencyCode
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

export async function fetchShopifyTransactionalEmailOrder(
  shopifyOrderId: string,
  graphql: typeof shopifyAdminGraphql = shopifyAdminGraphql
): Promise<ShopifyTransactionalEmailOrder | null> {
  const parsedOrderId = z.string()
    .regex(/^gid:\/\/shopify\/Order\/[1-9][0-9]{0,19}$/u)
    .safeParse(shopifyOrderId)

  if (!parsedOrderId.success) {
    throw new Error(
      'shopify_transactional_email_order_id_invalid'
    )
  }

  const response = responseSchema.safeParse(
    await graphql<unknown>(
      SHOPIFY_TRANSACTIONAL_EMAIL_ORDER_QUERY,
      { id: parsedOrderId.data }
    )
  )

  if (!response.success) {
    throw new Error(
      'shopify_transactional_email_order_response_invalid'
    )
  }

  if (response.data.order?.lineItems.pageInfo.hasNextPage) {
    throw new Error(
      'shopify_transactional_email_order_line_items_truncated'
    )
  }

  return response.data.order
}
