import type { CanonicalMetaAppEvent } from '../metaNonWebCanonicalEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapMetaAppEventToServerEvent } from './mapMetaAppEventToServerEvent'

export const dispatchCanonicalMetaAppEventToMeta =
  createCanonicalMetaDispatch<
    CanonicalMetaAppEvent,
    'meta_app_event'
  >({
    eventName: 'meta_app_event',
    mapEvent: event =>
      mapMetaAppEventToServerEvent(event.meta_event)
  })
