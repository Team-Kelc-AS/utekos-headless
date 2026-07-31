import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalFormSubmitCustomDataSchema = z.strictObject({
  submission_id: z.string().min(1),
  form_id: z.string().min(1),
  form_name: z.string().min(1),
  result: z.enum(['accepted', 'rejected'])
})

export const canonicalFormSubmitSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('form_submit'),
  source: z.literal('server'),
  page_url: z.string().url().optional(),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalFormSubmitCustomDataSchema
})

export type CanonicalFormSubmit = z.infer<typeof canonicalFormSubmitSchema>
