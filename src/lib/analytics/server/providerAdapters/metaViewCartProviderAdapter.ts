import { canonicalViewCartSchema } from '../../viewCartEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalViewCartToMeta } from '../dispatchCanonicalViewCartToMeta'

export const metaViewCartProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonicalViewCartToMeta,
  eventName: 'view_cart',
  key: 'meta:view_cart',
  schema: canonicalViewCartSchema
})
