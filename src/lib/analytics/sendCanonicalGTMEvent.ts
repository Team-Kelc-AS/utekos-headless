import { sendGTMEvent } from '@next/third-parties/google'
import { enrichCanonicalEventWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import { enrichBrowserMetaAudience } from './browserMetaAudience'
import type { CanonicalEventEnvelope } from './canonicalEventEnvelope'

export const META_CANONICAL_BROWSER_EVENT =
  'utekos:meta-canonical-browser-event'

// Preserve synchronous Meta delivery; enrich GA4 identity before Data Tag runs.
export async function sendCanonicalGTMEvent(
  data: Record<string, unknown>,
  enrichGoogleIds = enrichCanonicalEventWithGoogleAnalyticsIds
) {
  const canonical = data.canonical_event as
    | CanonicalEventEnvelope
    | undefined
  if (!canonical?.consent) {
    sendGTMEvent(data)
    return
  }
  const audienceEnriched = enrichBrowserMetaAudience(canonical)
  const browserData = {
    ...data,
    canonical_event: audienceEnriched,
    meta_audience: audienceEnriched.meta_audience ?? null
  }

  if (
    typeof window !== 'undefined' &&
    typeof window.dispatchEvent === 'function' &&
    typeof CustomEvent === 'function'
  ) {
    window.dispatchEvent(
      new CustomEvent(META_CANONICAL_BROWSER_EVENT, {
        detail: browserData
      })
    )
  }

  const enriched =
    canonical.browser_id?.ga_client_id && canonical.browser_id?.ga_session_id ?
      audienceEnriched
    : await enrichGoogleIds(audienceEnriched)
  sendGTMEvent({ ...browserData, canonical_event: enriched })
}
