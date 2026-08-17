import { canonicalAddShippingInfoSchema } from '../../addShippingInfoEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalAddShippingInfoToMeta } from '../dispatchCanonicalAddShippingInfoToMeta'

export const metaAddShippingInfoProviderAdapter =
  createMetaProviderAdapter({
    dispatch: dispatchCanonicalAddShippingInfoToMeta,
    eventName: 'add_shipping_info',
    key: 'meta:add_shipping_info',
    schema: canonicalAddShippingInfoSchema
  })
