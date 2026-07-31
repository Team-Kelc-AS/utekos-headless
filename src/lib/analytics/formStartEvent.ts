import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalFormStartCustomDataSchema = z.strictObject({
  form_id: z.string().min(1),
  form_name: z.string().min(1),
  field_category: z.string().min(1).optional()
})

export const canonicalFormStartSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('form_start'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid(),
  custom_data: canonicalFormStartCustomDataSchema
})

export type CanonicalFormStart = z.infer<typeof canonicalFormStartSchema>
