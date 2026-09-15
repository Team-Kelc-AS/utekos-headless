import { sendGTMEvent } from '@next/third-parties/google'
import { enrichBrowserMetaAudience } from './browserMetaAudience'
import type { CanonicalEventEnvelope } from './canonicalEventEnvelope'

export const META_CANONICAL_BROWSER_EVENT =
  'utekos:meta-canonical-browser-event'

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
  const enrichedData = {
    ...data,
    canonical_event: enriched,
    meta_audience: enriched.meta_audience ?? null
  }

  sendGTMEvent(enrichedData)

  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function' &&
    typeof CustomEvent === 'function'
  ) {
    window.dispatchEvent(
      new CustomEvent(META_CANONICAL_BROWSER_EVENT, {
        detail: enrichedData
      })
    )
  }
}
