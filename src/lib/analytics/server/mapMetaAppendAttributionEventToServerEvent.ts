import 'server-only'

import { CustomData } from 'facebook-nodejs-business-sdk'
import {
  assertMetaAppendAttributionIsSendable,
  metaAppendAttributionEventSchema,
  type MetaAppendAttributionEvent
} from '../metaAppendAttributionContract'
import { buildMetaExactAppData } from './buildMetaExactAppData'
import { buildMetaObservedUserData } from './buildMetaObservedUserData'
import { ExactMetaServerEvent } from './ExactMetaServerEvent'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

export function calculateMetaAppendAttributionValue(
  conversionValue: number,
  attributionShare: number
) {
  return Number(
    (conversionValue * attributionShare).toFixed(6)
  )
}

export function mapMetaAppendAttributionEventToServerEvent(
  rawEvent: MetaAppendAttributionEvent
): ExactMetaServerEvent {
  const event = metaAppendAttributionEventSchema.parse(rawEvent)
  const userData = buildMetaObservedUserData(event.user_data)

  if (event.action_source === 'app') {
    if (event.user_data.anon_id) {
      userData.setAnonId(event.user_data.anon_id)
    }
    if (event.user_data.app_user_id) {
      userData.setAppUserId(event.user_data.app_user_id)
    }
    if (event.user_data.madid) {
      userData.setMadid(event.user_data.madid)
    }
  }

  const serverEvent = new ExactMetaServerEvent({
    ...(event.action_source === 'app' ?
      {
        appData: buildMetaExactAppData(
          event.advertiser_tracking_enabled,
          event.app_data
        )
      }
    : {}),
    topLevel: {
      attribution_data: {
        ad_id: event.attribution_data.ad_id,
        attribution_share:
          event.attribution_data.attribution_share,
        attribution_value:
          calculateMetaAppendAttributionValue(
            event.conversion_value,
            event.attribution_data.attribution_share
          ),
        touchpoint_ts: event.attribution_data.touchpoint_ts
      },
      original_event_data: event.original_event_data,
      ...(event.opt_out === undefined ?
        {}
      : { opt_out: event.opt_out })
    }
  })

  serverEvent
    .setEventName(event.event_name)
    .setEventTime(event.event_time)
    .setEventId(event.event_id)
    .setActionSource(event.action_source)
    .setCustomData(
      new CustomData().setCurrency(
        event.custom_data.currency
      )
    )
    .setUserData(userData)

  if (event.action_source === 'website') {
    serverEvent.setEventSourceUrl(event.event_source_url)
    if (event.referrer_url) {
      serverEvent.setReferrerUrl(event.referrer_url)
    }
  } else {
    serverEvent.setAdvertiserTrackingEnabled(
      event.advertiser_tracking_enabled
    )
  }

  return serverEvent
}

export async function sendMetaAppendAttributionEvent(
  event: MetaAppendAttributionEvent,
  config: MetaConversionsApiConfig = readMetaConversionsApiConfig(),
  nowUnixSeconds = Math.floor(Date.now() / 1000)
): Promise<MetaSendResult> {
  const sendableEvent = assertMetaAppendAttributionIsSendable(
    event,
    nowUnixSeconds
  )

  return sendMetaServerEvent(
    mapMetaAppendAttributionEventToServerEvent(sendableEvent),
    config
  )
}
