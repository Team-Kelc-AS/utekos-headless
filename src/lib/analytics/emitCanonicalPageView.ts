import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import {
  buildPageViewDataLayerEvent,
  type CanonicalPageView
} from './pageViewEvent'
import { browserPageViewSession } from './pageViewSession'
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

  browserPageViewSession.recordEmitted({
    pageUrl: event.page_url,
    pageViewId: event.page_view_id,
    ...(event.referrer_url ?
      { referrerUrl: event.referrer_url }
    : {})
  })
}
