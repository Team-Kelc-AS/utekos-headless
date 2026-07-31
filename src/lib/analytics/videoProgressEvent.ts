import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'

export const canonicalVideoProgressCustomDataSchema = z.strictObject({
  video_id: z.string().min(1),
  milestone: z.union([
    z.literal(10),
    z.literal(25),
    z.literal(50),
    z.literal(75),
    z.literal(90),
    z.literal(100)
  ]),
  video_title: z.string().min(1),
  video_duration: z.number().finite().nonnegative(),
  video_current_time: z.number().finite().nonnegative(),
  video_percent: z.number().int().min(1).max(100)
})

export const canonicalVideoProgressSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('video_progress'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid(),
  custom_data: canonicalVideoProgressCustomDataSchema
})

export type CanonicalVideoProgress = z.infer<
  typeof canonicalVideoProgressSchema
>
