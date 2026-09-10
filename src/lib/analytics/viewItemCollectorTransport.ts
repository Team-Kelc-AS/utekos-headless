import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import {
  applyCanonicalCollectionContext,
  type CanonicalCollectionContext
} from './applyCanonicalCollectionContext'
import { createCanonicalCollectorTransport } from './createCanonicalCollectorTransport'
import { enrichCanonicalViewItemWithGoogleAnalyticsIds } from './googleAnalyticsBrowserIds'
import type { CanonicalViewItem } from './viewItemEvent'

export type ViewItemCollectionContext =
  CanonicalCollectionContext
export type ResolvedViewItemCollection = {
  context: ViewItemCollectionContext
  event: CanonicalViewItem
}
type Dependencies = {
  postEvent: (event: CanonicalViewItem) => Promise<void>
  reportError: (error: unknown) => void
  resolveCurrentCollection: (
    event: CanonicalViewItem
  ) => ResolvedViewItemCollection
  subscribeToConsentChanges: (listener: () => void) => () => void
}
export function applyViewItemCollectionContext(
  event: CanonicalViewItem,
  context: ViewItemCollectionContext
) {
  return applyCanonicalCollectionContext(event, context)
}
function permitted(event: CanonicalViewItem) {
  return (
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'
  )
}
export function createViewItemCollectorTransport(
  dependencies: Dependencies
) {
  return (event: CanonicalViewItem): (() => void) => {
    if (!permitted(event)) return () => {}
    const current = dependencies.resolveCurrentCollection(event)
    if (
      current.context.hasResponse &&
      permitted(current.event)
    ) {
      void dependencies
        .postEvent(current.event)
        .catch(dependencies.reportError)
    }
    return () => {}
  }
}
const transport =
  createCanonicalCollectorTransport<CanonicalViewItem>({
    analyticsEventName: 'view_item',
    endpoint: '/api/events/view-item',
    enrichEvent: enrichCanonicalViewItemWithGoogleAnalyticsIds
  })
export function startViewItemCollectorTransport(
  event: CanonicalViewItem
): () => void {
  try {
    return transport(event)
  } catch (error) {
    reportClientCaughtError(
      error,
      'view_item.first_party_collector'
    )
    return () => {}
  }
}
