import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalSortApplyCustomDataSchema = z.strictObject({
  interaction_id: z.string().min(1),
  result_revision: z.number().int().positive(),
  sort_key: z.string().min(1),
  result_count: z.number().int().nonnegative()
})

export const canonicalSortApplySchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('sort_apply'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalSortApplyCustomDataSchema
})

export type CanonicalSortApply = z.infer<typeof canonicalSortApplySchema>
