import type { CanonicalViewItemList } from '../viewItemListEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalViewItemListToMeta } from './mapCanonicalViewItemListToMeta'

export const dispatchCanonicalViewItemListToMeta =
  createCanonicalMetaDispatch<CanonicalViewItemList, 'view_item_list'>({
    eventName: 'view_item_list',
    mapEvent: mapCanonicalViewItemListToMeta
  })
