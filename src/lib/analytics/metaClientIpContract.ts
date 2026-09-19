import * as z from '@/lib/validation/zodMini'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const metaClientIpRequestSchema = z.strictObject({
  consent: canonicalEventEnvelopeSchema.shape.consent.check(
    z.refine(consent => consent.marketing === 'granted', {
      message: 'Marketing consent is required'
    })
  )
})

export const metaClientIpResponseSchema = z.strictObject({
  client_ip_address: z
    .string()
    .check(z.trim(), z.minLength(1), z.maxLength(128))
})
