import { canonicalScrollDepthSchema } from '../../scrollDepthEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalScrollDepthToMeta } from '../dispatchCanonicalScrollDepthToMeta'

export const metaScrollDepthProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonicalScrollDepthToMeta,
  eventName: 'scroll_depth',
  key: 'meta:scroll_depth',
  schema: canonicalScrollDepthSchema
})
