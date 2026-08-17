import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalAddPaymentInfo } from '../addPaymentInfoEvent'
import { mapCanonicalAddPaymentInfoToMeta } from './mapCanonicalAddPaymentInfoToMeta'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

type Dependencies = {
  mapEvent: (event: CanonicalAddPaymentInfo) => ServerEvent
  readConfig: () => MetaConversionsApiConfig
  sendEvent: (
    event: ServerEvent,
    config: MetaConversionsApiConfig
  ) => Promise<MetaSendResult>
}
const defaultDependencies: Dependencies = {
  mapEvent: mapCanonicalAddPaymentInfoToMeta,
  readConfig: readMetaConversionsApiConfig,
  sendEvent: sendMetaServerEvent
}

export async function dispatchCanonicalAddPaymentInfoToMeta(
  event: CanonicalAddPaymentInfo,
  dependencies: Dependencies = defaultDependencies
) {
  const result = await dependencies.sendEvent(
    dependencies.mapEvent(event),
    dependencies.readConfig()
  )
  return {
    eventId: event.event_id,
    eventName: 'add_payment_info' as const,
    provider: 'meta' as const,
    result
  }
}
