import { z } from 'zod'
import { canonicalPageViewSchema } from './pageViewEvent'

export const provisionalPageViewCaptureStateSchema = z.enum([
  'pending',
  'denied',
  'granted'
])

export const provisionalPageViewCaptureSchema = z.object({
  capture_state: provisionalPageViewCaptureStateSchema,
  event: canonicalPageViewSchema
})

export type ProvisionalPageViewCapture = z.infer<
  typeof provisionalPageViewCaptureSchema
>
export type ProvisionalPageViewCaptureState = z.infer<
  typeof provisionalPageViewCaptureStateSchema
>
