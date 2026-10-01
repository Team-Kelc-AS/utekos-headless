import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import {
  buildPageViewDataLayerEvent,
  type CanonicalPageView
} from './pageViewEvent'
import { enrichBrowserMetaAudience } from './browserMetaAudience'

export function emitCanonicalPageView(
  event: CanonicalPageView,
  metaOnly = false
): void {
  const data = buildPageViewDataLayerEvent(event)
  if (metaOnly) {
    // Buffer before the Meta transport loads; this layout intentionally has no GTM.
    const target = window as Window & { dataLayer?: unknown[] }
    target.dataLayer ??= []
    target.dataLayer.push({
      ...data,
      canonical_event: enrichBrowserMetaAudience(event)
    })
  } else {
    sendGTMEvent(data)
  }
}
