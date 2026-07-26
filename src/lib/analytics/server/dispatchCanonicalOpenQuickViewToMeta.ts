import type { CanonicalOpenQuickView } from '../openQuickViewEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalOpenQuickViewToMeta } from './mapCanonicalOpenQuickViewToMeta'

export const dispatchCanonicalOpenQuickViewToMeta =
  createCanonicalMetaDispatch<CanonicalOpenQuickView, 'open_quick_view'>({
    eventName: 'open_quick_view',
    mapEvent: mapCanonicalOpenQuickViewToMeta
  })
