import { canonicalOpenQuickViewSchema } from '../../openQuickViewEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalOpenQuickViewToMeta } from '../dispatchCanonicalOpenQuickViewToMeta'

export const metaOpenQuickViewProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonicalOpenQuickViewToMeta,
  eventName: 'open_quick_view',
  key: 'meta:open_quick_view',
  schema: canonicalOpenQuickViewSchema
})
