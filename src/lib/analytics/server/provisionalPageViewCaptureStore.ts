import type { ProvisionalPageViewCapture } from '../provisionalPageViewCapture'

export type ProvisionalPageViewCaptureStore = {
  capture: (
    capture: ProvisionalPageViewCapture
  ) => Promise<'inserted' | 'updated'>
  release: (eventId: string) => Promise<void>
}
