import { createHash } from 'node:crypto'
import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

const purchaseItemSchema = z.strictObject({
  item_id: z.string().min(1),
  item_name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().finite().nonnegative(),
  final_unit_price: z.number().finite().nonnegative().optional(),
  discount: z.number().finite().nonnegative().optional(),
  sku: z.string().min(1).optional(),
  item_brand: z.string().min(1).optional(),
  item_category: z.string().min(1).optional()
})

export const canonicalPurchaseCommerceSchema = z.strictObject({
  currency: z.string().regex(/^[A-Z]{3}$/),
  value: z.number().finite().nonnegative(),
  item_revenue: z.number().finite().nonnegative().optional(),
  tax_value: z.number().finite().nonnegative().optional(),
  shipping_value: z.number().finite().nonnegative().optional(),
  transaction_discount: z
    .number()
    .finite()
    .nonnegative()
    .optional(),
  coupon_codes: z
    .array(z.string().min(1).max(100))
    .max(10)
    .optional(),
  transaction_id: z.string().min(1),
  order_name: z.string().min(1),
  items: z.array(purchaseItemSchema).min(1)
})

export const canonicalPurchaseSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('purchase'),
    source: z.enum(['webhook', 'server']),
    referrer_url: z.string().url().optional(),
    custom_data: canonicalPurchaseCommerceSchema
  })

export type CanonicalPurchase = z.infer<
  typeof canonicalPurchaseSchema
>

export function deterministicPurchaseEventId(
  shopifyOrderLegacyId: string
) {
  const hash = createHash('sha256')
    .update(`utekos:purchase:${shopifyOrderLegacyId}:paid`)
    .digest()
  const bytes = Uint8Array.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function shopifyPurchaseTransactionId(
  shopifyOrderLegacyId: string
) {
  return `shopify_order_${shopifyOrderLegacyId}`
}
