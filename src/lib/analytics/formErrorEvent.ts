import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalFormErrorCustomDataSchema = z.strictObject({
  attempt_id: z.string().min(1),
  form_id: z.string().min(1),
  error_category: z.string().min(1)
})

export const canonicalFormErrorSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('form_error'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalFormErrorCustomDataSchema
})

export type CanonicalFormError = z.infer<typeof canonicalFormErrorSchema>
