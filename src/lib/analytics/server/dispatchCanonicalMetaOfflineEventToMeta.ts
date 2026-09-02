import type { CanonicalMetaOfflineEvent } from '../metaNonWebCanonicalEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapMetaOfflineEventToServerEvent } from './mapMetaOfflineEventToServerEvent'

export const dispatchCanonicalMetaOfflineEventToMeta =
  createCanonicalMetaDispatch<
    CanonicalMetaOfflineEvent,
    'meta_offline_event'
  >({
    eventName: 'meta_offline_event',
    mapEvent: event =>
      mapMetaOfflineEventToServerEvent(event.meta_event)
  })
