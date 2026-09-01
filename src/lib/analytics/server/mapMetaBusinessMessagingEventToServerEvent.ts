import 'server-only'

import { CustomData } from 'facebook-nodejs-business-sdk'
import {
  metaBusinessMessagingEventSchema,
  type MetaBusinessMessagingEvent
} from '../metaNonWebEventContract'
import { buildMetaObservedUserData } from './buildMetaObservedUserData'
import { ExactMetaServerEvent } from './ExactMetaServerEvent'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

export function mapMetaBusinessMessagingEventToServerEvent(
  rawEvent: MetaBusinessMessagingEvent
): ExactMetaServerEvent {
  const event = metaBusinessMessagingEventSchema.parse(rawEvent)
  const userData = buildMetaObservedUserData(event.user_data)
  const exactUserData: Record<string, string> = {}

  switch (event.messaging_channel) {
    case 'whatsapp':
      userData.setCtwaClid(event.user_data.ctwa_clid)
      exactUserData.whatsapp_business_account_id =
        event.user_data.whatsapp_business_account_id
      break
    case 'messenger':
      userData.setPageId(event.user_data.page_id)
      exactUserData.page_scoped_user_id =
        event.user_data.page_scoped_user_id
      break
    case 'instagram':
      exactUserData.ig_account_id = event.user_data.ig_account_id
      exactUserData.ig_sid = event.user_data.ig_sid
      break
  }

  const customData =
    event.custom_data ?
      new CustomData().setCustomProperties(event.custom_data)
    : undefined
  const serverEvent = new ExactMetaServerEvent({
    topLevel: {
      ...(event.opt_out === undefined ?
        {}
      : { opt_out: event.opt_out }),
      ...(event.original_event_data ?
        { original_event_data: event.original_event_data }
      : {})
    },
    userData: exactUserData
  })

  serverEvent
    .setEventName(event.event_name)
    .setEventTime(event.event_time)
    .setEventId(event.event_id)
    .setActionSource('business_messaging')
    .setMessagingChannel(event.messaging_channel)
    .setUserData(userData)

  if (customData) serverEvent.setCustomData(customData)

  return serverEvent
}

export async function sendMetaBusinessMessagingEvent(
  event: MetaBusinessMessagingEvent,
  config: MetaConversionsApiConfig = readMetaConversionsApiConfig()
): Promise<MetaSendResult> {
  return sendMetaServerEvent(
    mapMetaBusinessMessagingEventToServerEvent(event),
    config
  )
}
