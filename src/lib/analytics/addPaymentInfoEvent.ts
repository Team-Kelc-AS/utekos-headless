import { createHash } from 'node:crypto'
import { z } from 'zod'
import { canonicalCommerceValueSchema } from './canonicalCommerceItem'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalAddPaymentInfoCommerceSchema =
  canonicalCommerceValueSchema.extend({
    checkout_id: z.string().min(1),
    payment_revision: z.string().min(1).max(255),
    begin_checkout_event_id: z.string().uuid()
  })

export const canonicalAddPaymentInfoSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('add_payment_info'),
    source: z.literal('web'),
    custom_data: canonicalAddPaymentInfoCommerceSchema
  })

export type CanonicalAddPaymentInfo = z.infer<
  typeof canonicalAddPaymentInfoSchema
>

export function deterministicAddPaymentInfoEventId(
  shopifySourceEventId: string
) {
  const hash = createHash('sha256')
    .update(
      `utekos:add_payment_info:shopify_web_pixel:${shopifySourceEventId}`
    )
    .digest()
  const bytes = Uint8Array.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}
