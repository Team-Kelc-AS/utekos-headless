import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalSizeGuideViewCustomDataSchema = z.strictObject({
  guide_id: z.string().min(1),
  open_sequence: z.number().int().positive()
})

export const canonicalSizeGuideViewSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('size_guide_view'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid(),
  custom_data: canonicalSizeGuideViewCustomDataSchema
})

export type CanonicalSizeGuideView = z.infer<
  typeof canonicalSizeGuideViewSchema
>
