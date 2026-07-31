import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalViewSearchResultsCustomDataSchema = z.strictObject({
  search_id: z.string().min(1),
  result_revision: z.number().int().positive(),
  search_term: z.string().min(1),
  result_count: z.number().int().nonnegative()
})

export const canonicalViewSearchResultsSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('view_search_results'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalViewSearchResultsCustomDataSchema
})

export type CanonicalViewSearchResults = z.infer<
  typeof canonicalViewSearchResultsSchema
>
