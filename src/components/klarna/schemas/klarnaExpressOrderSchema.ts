import * as z from '@/lib/validation/zodMini'
import { checkoutAttributionSnapshotSchema } from '@/lib/analytics/checkoutAttributionSnapshot'
import { shopifyPublicCartIdSchema } from '@/lib/cart/shopifyPublicCartIdSchema'

const klarnaOrderLineTypeSchema = z.enum([
  'physical',
  'discount',
  'shipping_fee',
  'sales_tax',
  'digital',
  'gift_card',
  'store_credit',
  'surcharge'
])

export const klarnaOrderLineSchema = z
  .object({
    name: z.string().check(z.minLength(1), z.maxLength(255)),
    quantity: z.number().check(z.int(), z.gt(0)),
    unit_price: z
      .number()
      .check(z.int(), z.gte(0), z.lte(200000000)),
    total_amount: z
      .number()
      .check(z.int(), z.gte(0), z.lte(200000000)),
    reference: z.optional(z.string().check(z.maxLength(255))),
    type: z.optional(klarnaOrderLineTypeSchema),
    tax_rate: z.optional(
      z.number().check(z.int(), z.gte(0), z.lte(10000))
    ),
    total_tax_amount: z.optional(z.number().check(z.int())),
    total_discount_amount: z.optional(
      z.number().check(z.int(), z.gte(0))
    )
  })
  .check(
    z.superRefine((line, context) => {
      const expectedTotal =
        line.quantity * line.unit_price -
        (line.total_discount_amount ?? 0)
      if (line.total_amount !== expectedTotal) {
        context.addIssue({
          code: 'custom',
          path: ['total_amount'],
          message:
            'total_amount must equal (quantity × unit_price) − total_discount_amount'
        })
      }
    })
  )

export const klarnaMerchantUrlsSchema = z.object({
  confirmation: z.string().check(z.url(), z.maxLength(2000)),
  notification: z.optional(
    z.string().check(z.url(), z.maxLength(2000))
  ),
  push: z.optional(z.string().check(z.url(), z.maxLength(2000))),
  authorization: z.optional(
    z.string().check(z.url(), z.maxLength(2000))
  )
})

export const klarnaExpressOrderPayloadSchema = z.object({
  purchase_country: z.string().check(z.length(2)),
  purchase_currency: z.string().check(z.length(3)),
  order_amount: z
    .number()
    .check(z.int(), z.gt(0), z.lte(200000000)),
  order_lines: z
    .array(klarnaOrderLineSchema)
    .check(z.minLength(1)),
  locale: z.optional(z.string()),
  merchant_reference1: z.optional(
    z.string().check(z.maxLength(255))
  ),
  merchant_reference2: z.optional(
    z.string().check(z.maxLength(255))
  ),
  merchant_urls: z.optional(klarnaMerchantUrlsSchema)
})

export const klarnaCollectedShippingAddressSchema = z.object({
  given_name: z.optional(z.string().check(z.maxLength(99))),
  family_name: z.optional(z.string().check(z.maxLength(99))),
  email: z.optional(z.string().check(z.maxLength(99))),
  phone: z.optional(z.string().check(z.maxLength(99))),
  street_address: z.optional(z.string().check(z.maxLength(100))),
  street_address2: z.optional(
    z.string().check(z.maxLength(100))
  ),
  postal_code: z.optional(z.string().check(z.maxLength(10))),
  city: z.optional(z.string().check(z.maxLength(99))),
  region: z.optional(z.string().check(z.maxLength(99))),
  country: z.optional(z.string().check(z.length(2)))
})

export const klarnaCreateOrderResponseSchema = z.object({
  order_id: z.string(),
  redirect_url: z.string().check(z.url()),
  fraud_status: z.optional(
    z.enum(['ACCEPTED', 'PENDING', 'REJECTED'])
  ),
  authorized_payment_method: z.optional(
    z.looseObject({ type: z.optional(z.string()) })
  )
})

export const klarnaCreateOrderRequestSchema = z.object({
  authorizationToken: z.string().check(z.minLength(1)),
  orderPayload: klarnaExpressOrderPayloadSchema,
  collectedShippingAddress: klarnaCollectedShippingAddressSchema,
  shopifyCartId: shopifyPublicCartIdSchema,
  attribution: z.optional(checkoutAttributionSnapshotSchema)
})

export type KlarnaOrderLine = z.infer<
  typeof klarnaOrderLineSchema
>
export type KlarnaExpressOrderPayload = z.infer<
  typeof klarnaExpressOrderPayloadSchema
>
export type KlarnaCollectedShippingAddress = z.infer<
  typeof klarnaCollectedShippingAddressSchema
>
export type KlarnaCreateOrderResponse = z.infer<
  typeof klarnaCreateOrderResponseSchema
>
export type KlarnaCreateOrderRequest = z.infer<
  typeof klarnaCreateOrderRequestSchema
>
