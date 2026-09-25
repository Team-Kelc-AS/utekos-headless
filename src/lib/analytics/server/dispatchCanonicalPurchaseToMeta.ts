import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalPurchase } from '../purchaseEvent'
import { mapCanonicalPurchaseToMeta } from './mapCanonicalPurchaseToMeta'
import { mapCanonicalPurchaseToMetaAppendAttribution } from './mapCanonicalPurchaseToMetaAppendAttribution'
import { mapMetaAppendAttributionEventToServerEvent } from './mapMetaAppendAttributionEventToServerEvent'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvents,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

export type MetaPurchaseDispatchDependencies = {
  mapEvent: (event: CanonicalPurchase) => ServerEvent
  mapAppendEvent: (
    event: CanonicalPurchase,
    nowUnixSeconds: number
  ) => ServerEvent | undefined
  nowUnixSeconds: () => number
  readConfig: () => MetaConversionsApiConfig
  sendEvents: (
    events: readonly ServerEvent[],
    config: MetaConversionsApiConfig
  ) => Promise<MetaSendResult>
}

export type MetaPurchaseDispatchReceipt = {
  eventId: string
  eventName: 'purchase'
  provider: 'meta'
  result: MetaSendResult
}

const defaultDependencies: MetaPurchaseDispatchDependencies = {
  mapAppendEvent: (event, nowUnixSeconds) => {
    const appendEvent =
      mapCanonicalPurchaseToMetaAppendAttribution(
        event,
        nowUnixSeconds
      )
    return appendEvent ?
        mapMetaAppendAttributionEventToServerEvent(appendEvent)
      : undefined
  },
  mapEvent: mapCanonicalPurchaseToMeta,
  nowUnixSeconds: () => Math.floor(Date.now() / 1000),
  readConfig: readMetaConversionsApiConfig,
  sendEvents: sendMetaServerEvents
}

export async function dispatchCanonicalPurchaseToMeta(
  event: CanonicalPurchase,
  dependencies: MetaPurchaseDispatchDependencies = defaultDependencies
): Promise<MetaPurchaseDispatchReceipt> {
  const metaEvent = dependencies.mapEvent(event)
  const appendEvent = dependencies.mapAppendEvent(
    event,
    dependencies.nowUnixSeconds()
  )
  const config = dependencies.readConfig()
  const result = await dependencies.sendEvents(
    appendEvent ? [metaEvent, appendEvent] : [metaEvent],
    config
  )

  return {
    eventId: event.event_id,
    eventName: 'purchase',
    provider: 'meta',
    result
  }
}
