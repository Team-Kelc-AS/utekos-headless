import type { CanonicalOpenQuickView } from '../openQuickViewEvent'
import { createCanonicalGoogleDataManagerDispatch } from './createCanonicalGoogleDataManagerDispatch'
import { mapCanonicalOpenQuickViewToGoogleDataManager } from './mapCanonicalOpenQuickViewToGoogleDataManager'

export const dispatchCanonicalOpenQuickViewToGoogleDataManager =
  createCanonicalGoogleDataManagerDispatch<
    CanonicalOpenQuickView,
    'open_quick_view'
  >({
    eventName: 'open_quick_view',
    mapEvent: mapCanonicalOpenQuickViewToGoogleDataManager
  })
