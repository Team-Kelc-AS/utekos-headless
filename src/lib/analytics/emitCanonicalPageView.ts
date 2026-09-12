import { sendCanonicalGTMEvent as sendGTMEvent } from './sendCanonicalGTMEvent'
import {
  buildPageViewDataLayerEvent,
  type CanonicalPageView
} from './pageViewEvent'
import { browserPageViewSession } from './pageViewSession'

export function emitCanonicalPageView(
  event: CanonicalPageView
): void {
  sendGTMEvent(buildPageViewDataLayerEvent(event))

  browserPageViewSession.recordEmitted({
    pageUrl: event.page_url,
    pageViewId: event.page_view_id,
    ...(event.referrer_url ?
      { referrerUrl: event.referrer_url }
    : {})
  })
}
