import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalSearchCustomDataSchema = z.strictObject({
  search_id: z.string().min(1),
  search_term: z.string().min(1),
  result_state: z.enum(['results', 'empty', 'error']).optional()
})

export const canonicalSearchSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('search'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalSearchCustomDataSchema
})

export type CanonicalSearch = z.infer<typeof canonicalSearchSchema>
