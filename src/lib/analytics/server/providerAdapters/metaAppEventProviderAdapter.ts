import { canonicalMetaAppEventSchema } from '../../metaNonWebCanonicalEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalMetaAppEventToMeta } from '../dispatchCanonicalMetaAppEventToMeta'

export const metaAppEventProviderAdapter =
  createMetaProviderAdapter({
    dispatch: dispatchCanonicalMetaAppEventToMeta,
    eventName: 'meta_app_event',
    key: 'meta:meta_app_event',
    schema: canonicalMetaAppEventSchema
  })
