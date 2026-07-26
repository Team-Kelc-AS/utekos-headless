import { canonicalViewItemListSchema } from '../../viewItemListEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalViewItemListToMeta } from '../dispatchCanonicalViewItemListToMeta'

export const metaViewItemListProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonicalViewItemListToMeta,
  eventName: 'view_item_list',
  key: 'meta:view_item_list',
  schema: canonicalViewItemListSchema
})
