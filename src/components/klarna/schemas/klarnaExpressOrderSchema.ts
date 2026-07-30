import { z } from 'zod'
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
    name: z.string().min(1).max(255),
    quantity: z.number().int().positive(),
    unit_price: z.number().int().nonnegative().max(200_000_000),
    total_amount: z
      .number()
      .int()
      .nonnegative()
      .max(200_000_000),
    reference: z.string().max(255).optional(),
    type: klarnaOrderLineTypeSchema.optional(),
    tax_rate: z.number().int().min(0).max(10_000).optional(),
    total_tax_amount: z.number().int().optional(),
    total_discount_amount: z.number().int().min(0).optional()
  })
  .superRefine((line, context) => {
    const expectedTotal =
      line.quantity * line.unit_price -
      (line.total_discount_amount ?? 0)

    if (line.total_amount !== expectedTotal) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['total_amount'],
        message:
          'total_amount must equal (quantity × unit_price) − total_discount_amount'
      })
    }
  })

export const klarnaMerchantUrlsSchema = z.object({
  confirmation: z.string().url().max(2000),
  notification: z.string().url().max(2000).optional(),
  push: z.string().url().max(2000).optional(),
  authorization: z.string().url().max(2000).optional()
})

export const klarnaExpressOrderPayloadSchema = z.object({
  purchase_country: z.string().length(2),
  purchase_currency: z.string().length(3),
  order_amount: z.number().int().positive().max(200_000_000),
  order_lines: z.array(klarnaOrderLineSchema).min(1),
  locale: z.string().optional(),
  merchant_reference1: z.string().max(255).optional(),
  merchant_reference2: z.string().max(255).optional(),
  merchant_urls: klarnaMerchantUrlsSchema.optional()
})

export const klarnaCollectedShippingAddressSchema = z.object({
  given_name: z.string().max(99).optional(),
  family_name: z.string().max(99).optional(),
  email: z.string().max(99).optional(),
  phone: z.string().max(99).optional(),
  street_address: z.string().max(100).optional(),
  street_address2: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(99).optional(),
  region: z.string().max(99).optional(),
  country: z.string().length(2).optional()
})

export const klarnaCreateOrderResponseSchema = z.object({
  order_id: z.string(),
  redirect_url: z.string().url(),
  fraud_status: z
    .enum(['ACCEPTED', 'PENDING', 'REJECTED'])
    .optional(),
  authorized_payment_method: z
    .object({ type: z.string().optional() })
    .passthrough()
    .optional()
})

export const klarnaCreateOrderRequestSchema = z.object({
  authorizationToken: z.string().min(1),
  orderPayload: klarnaExpressOrderPayloadSchema,
  collectedShippingAddress: klarnaCollectedShippingAddressSchema,
  shopifyCartId: shopifyPublicCartIdSchema,
  attribution: checkoutAttributionSnapshotSchema.optional()
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
