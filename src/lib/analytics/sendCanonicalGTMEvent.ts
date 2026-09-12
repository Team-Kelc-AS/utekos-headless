import { sendGTMEvent } from '@next/third-parties/google'
import { enrichBrowserMetaAudience } from './browserMetaAudience'
import type { CanonicalEventEnvelope } from './canonicalEventEnvelope'

// Keep the existing GTM sender; only attach validated metadata to canonical events.
export function sendCanonicalGTMEvent(
  data: Record<string, unknown>
) {
  const canonical = data.canonical_event as
    | CanonicalEventEnvelope
    | undefined
  if (!canonical?.consent) {
    sendGTMEvent(data)
    return
  }
  const enriched = enrichBrowserMetaAudience(canonical)
  sendGTMEvent({
    ...data,
    canonical_event: enriched,
    meta_audience: enriched.meta_audience ?? null
  })
}
