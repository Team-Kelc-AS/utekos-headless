import { collectCanonicalEventUntilAccepted } from './createCanonicalCollectorTransport'
import type { CanonicalViewItemList } from './viewItemListEvent'

const viewItemListCollectorInput = {
  analyticsEventName: 'view_item_list',
  endpoint: '/api/events/view-item-list'
}

export function collectViewItemListUntilAccepted(
  event: CanonicalViewItemList
) {
  return collectCanonicalEventUntilAccepted(
    viewItemListCollectorInput,
    event
  )
}
