import 'server-only'

import { CustomData } from 'facebook-nodejs-business-sdk'
import {
  metaAppEventSchema,
  type MetaAppEvent
} from '../metaNonWebEventContract'
import { buildMetaExactAppData } from './buildMetaExactAppData'
import { buildMetaObservedUserData } from './buildMetaObservedUserData'
import { ExactMetaServerEvent } from './ExactMetaServerEvent'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

export function mapMetaAppEventToServerEvent(
  rawEvent: MetaAppEvent
): ExactMetaServerEvent {
  const event = metaAppEventSchema.parse(rawEvent)
  const userData = buildMetaObservedUserData(event.user_data)

  if (event.user_data.anon_id) {
    userData.setAnonId(event.user_data.anon_id)
  }
  if (event.user_data.app_user_id) {
    userData.setAppUserId(event.user_data.app_user_id)
  }
  if (event.user_data.madid) {
    userData.setMadid(event.user_data.madid)
  }

  const customData =
    event.custom_data ?
      new CustomData().setCustomProperties(event.custom_data)
    : undefined
  const serverEvent = new ExactMetaServerEvent({
    appData: buildMetaExactAppData(
      event.advertiser_tracking_enabled,
      event.app_data
    ),
    topLevel: {
      ...(event.opt_out === undefined ?
        {}
      : { opt_out: event.opt_out }),
      ...(event.original_event_data ?
        { original_event_data: event.original_event_data }
      : {})
    }
  })

  serverEvent
    .setEventName(event.event_name)
    .setEventTime(event.event_time)
    .setEventId(event.event_id)
    .setActionSource('app')
    .setAdvertiserTrackingEnabled(
      event.advertiser_tracking_enabled
    )
    .setUserData(userData)

  if (customData) serverEvent.setCustomData(customData)

  return serverEvent
}

export async function sendMetaAppEvent(
  event: MetaAppEvent,
  config: MetaConversionsApiConfig = readMetaConversionsApiConfig()
): Promise<MetaSendResult> {
  return sendMetaServerEvent(
    mapMetaAppEventToServerEvent(event),
    config
  )
}
