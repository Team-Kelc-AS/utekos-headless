import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const metaClientIpRequestSchema = z.strictObject({
  consent: canonicalEventEnvelopeSchema.shape.consent.refine(
    consent => consent.marketing === 'granted',
    { message: 'Marketing consent is required' }
  )
})

export const metaClientIpResponseSchema = z.strictObject({
  client_ip_address: z.string().trim().min(1).max(128)
})
