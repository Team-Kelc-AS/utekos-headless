import { createHash } from 'node:crypto'
import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'
import { orderConsentSnapshotSchema } from './checkoutConsentSnapshot'

const refundItemSchema = z.strictObject({
  item_id: z.string().min(1),
  item_name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().finite().nonnegative(),
  sku: z.string().min(1).optional()
})

export const canonicalRefundCommerceSchema = z.strictObject({
  currency: z.string().regex(/^[A-Z]{3}$/),
  value: z.number().finite().nonnegative(),
  transaction_id: z.string().min(1),
  refund_id: z.string().min(1),
  items: z.array(refundItemSchema)
})

export const canonicalRefundSchema = canonicalEventEnvelopeSchema
  .omit({ consent: true })
  .extend({
    consent: orderConsentSnapshotSchema,
    event_name: z.literal('refund'),
    source: z.enum(['webhook', 'server']),
    referrer_url: z.string().url().optional(),
    custom_data: canonicalRefundCommerceSchema
  })

export type CanonicalRefund = z.infer<
  typeof canonicalRefundSchema
>

export function deterministicRefundEventId(refundId: string) {
  const hash = createHash('sha256')
    .update(`utekos:refund:${refundId}:created`)
    .digest()
  const bytes = Uint8Array.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function shopifyRefundRecordId(refundId: string) {
  return `shopify_refund_${refundId}`
}
