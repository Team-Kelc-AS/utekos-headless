import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalFilterApplyCustomDataSchema = z.strictObject({
  interaction_id: z.string().min(1),
  result_revision: z.number().int().positive(),
  filter_name: z.string().min(1),
  filter_value: z.string().min(1),
  result_count: z.number().int().nonnegative()
})

export const canonicalFilterApplySchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('filter_apply'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalFilterApplyCustomDataSchema
})

export type CanonicalFilterApply = z.infer<typeof canonicalFilterApplySchema>
