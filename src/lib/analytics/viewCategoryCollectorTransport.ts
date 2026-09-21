import { collectCanonicalEventUntilAccepted } from './createCanonicalCollectorTransport'
import type { CanonicalViewCategory } from './viewCategoryEvent'

const viewCategoryCollectorInput = {
  analyticsEventName: 'view_category',
  endpoint: '/api/events/view-category'
}

export function collectViewCategoryUntilAccepted(
  event: CanonicalViewCategory
) {
  return collectCanonicalEventUntilAccepted(
    viewCategoryCollectorInput,
    event
  )
}
