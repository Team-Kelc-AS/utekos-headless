import type { CanonicalOpenQuickView } from '../openQuickViewEvent'
import { mapCanonicalWebEventToGoogleDataManager } from './mapCanonicalWebEventToGoogleDataManager'

export function mapCanonicalOpenQuickViewToGoogleDataManager(
  event: CanonicalOpenQuickView
) {
  return mapCanonicalWebEventToGoogleDataManager(
    event,
    'open_quick_view'
  )
}
