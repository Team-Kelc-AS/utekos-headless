import type { CanonicalViewCategory } from '../viewCategoryEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalViewCategoryToMeta } from './mapCanonicalViewCategoryToMeta'

export const dispatchCanonicalViewCategoryToMeta =
  createCanonicalMetaDispatch<CanonicalViewCategory, 'view_category'>({
    eventName: 'view_category',
    mapEvent: mapCanonicalViewCategoryToMeta
  })
