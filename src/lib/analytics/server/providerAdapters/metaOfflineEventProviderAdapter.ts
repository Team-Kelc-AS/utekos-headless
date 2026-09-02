import { canonicalMetaOfflineEventSchema } from '../../metaNonWebCanonicalEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalMetaOfflineEventToMeta } from '../dispatchCanonicalMetaOfflineEventToMeta'

export const metaOfflineEventProviderAdapter =
  createMetaProviderAdapter({
    dispatch: dispatchCanonicalMetaOfflineEventToMeta,
    eventName: 'meta_offline_event',
    key: 'meta:meta_offline_event',
    schema: canonicalMetaOfflineEventSchema
  })
