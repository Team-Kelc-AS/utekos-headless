import { canonicalViewCategorySchema } from '../../viewCategoryEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalViewCategoryToMeta } from '../dispatchCanonicalViewCategoryToMeta'

export const metaViewCategoryProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonicalViewCategoryToMeta,
  eventName: 'view_category',
  key: 'meta:view_category',
  schema: canonicalViewCategorySchema
})
