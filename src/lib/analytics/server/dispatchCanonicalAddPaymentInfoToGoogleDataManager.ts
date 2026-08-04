import type { protos } from '@google-ads/datamanager'
import type { CanonicalAddPaymentInfo } from '../addPaymentInfoEvent'
import { mapCanonicalAddPaymentInfoToGoogleDataManager } from './mapCanonicalAddPaymentInfoToGoogleDataManager'
import {
  readGoogleDataManagerConfig,
  sendGoogleDataManagerEvent,
  type GoogleDataManagerConfig,
  type GoogleDataManagerSendResult
} from './sendGoogleDataManagerEvent'

type Dependencies = {
  mapEvent: (
    event: CanonicalAddPaymentInfo
  ) => protos.google.ads.datamanager.v1.Event
  readConfig: () => GoogleDataManagerConfig
  sendEvent: (
    event: protos.google.ads.datamanager.v1.Event,
    config: GoogleDataManagerConfig
  ) => Promise<GoogleDataManagerSendResult>
}

const defaultDependencies: Dependencies = {
  mapEvent: mapCanonicalAddPaymentInfoToGoogleDataManager,
  readConfig: readGoogleDataManagerConfig,
  sendEvent: sendGoogleDataManagerEvent
}

export async function dispatchCanonicalAddPaymentInfoToGoogleDataManager(
  event: CanonicalAddPaymentInfo,
  dependencies: Dependencies = defaultDependencies
) {
  const dataManagerEvent = dependencies.mapEvent(event)
  const config = dependencies.readConfig()
  const result = await dependencies.sendEvent(dataManagerEvent, config)

  return {
    eventId: event.event_id,
    eventName: 'add_payment_info' as const,
    provider: 'google_data_manager' as const,
    result
  }
}
