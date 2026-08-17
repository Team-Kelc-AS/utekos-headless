import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalAddShippingInfo } from '../addShippingInfoEvent'
import { mapCanonicalAddShippingInfoToMeta } from './mapCanonicalAddShippingInfoToMeta'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

type Dependencies = {
  mapEvent: (event: CanonicalAddShippingInfo) => ServerEvent
  readConfig: () => MetaConversionsApiConfig
  sendEvent: (
    event: ServerEvent,
    config: MetaConversionsApiConfig
  ) => Promise<MetaSendResult>
}
const defaultDependencies: Dependencies = {
  mapEvent: mapCanonicalAddShippingInfoToMeta,
  readConfig: readMetaConversionsApiConfig,
  sendEvent: sendMetaServerEvent
}

export async function dispatchCanonicalAddShippingInfoToMeta(
  event: CanonicalAddShippingInfo,
  dependencies: Dependencies = defaultDependencies
) {
  const result = await dependencies.sendEvent(
    dependencies.mapEvent(event),
    dependencies.readConfig()
  )
  return {
    eventId: event.event_id,
    eventName: 'add_shipping_info' as const,
    provider: 'meta' as const,
    result
  }
}
