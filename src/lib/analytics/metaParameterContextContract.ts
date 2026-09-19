import * as z from '@/lib/validation/zodMini'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const metaParameterContextRequestSchema = z.strictObject({
  consent: canonicalEventEnvelopeSchema.shape.consent.check(
    z.refine(consent => consent.marketing === 'granted', {
      message: 'Marketing consent is required'
    })
  ),
  fbclid: z.optional(
    z.string().check(z.trim(), z.minLength(1), z.maxLength(4096))
  ),
  page_url: z.string().check(z.url(), z.maxLength(4096)),
  referrer_url: z.optional(
    z.string().check(z.url(), z.maxLength(4096))
  )
})

export const metaParameterContextResponseSchema = z.strictObject(
  {
    fbc: z.optional(z.string().check(z.minLength(1))),
    fbp: z.string().check(z.minLength(1))
  }
)

export type MetaParameterContextRequest = z.infer<
  typeof metaParameterContextRequestSchema
>

export type MetaParameterContextResponse = z.infer<
  typeof metaParameterContextResponseSchema
>
