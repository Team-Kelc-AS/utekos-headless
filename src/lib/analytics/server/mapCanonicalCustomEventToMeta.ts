import {
  CustomData,
  ServerEvent
} from 'facebook-nodejs-business-sdk'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { buildMetaUserData } from './buildMetaUserData'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

type CanonicalMetaCustomEvent = CanonicalEventEnvelope & {
  page_url: string
}

export function mapCanonicalCustomEventToMeta(
  event: CanonicalMetaCustomEvent,
  metaEventName: string,
  customProperties: Record<string, boolean | number | string>
): ServerEvent {
  if (event.consent.marketing !== 'granted') {
    throw new Error(
      'Meta dispatch requires granted marketing consent'
    )
  }

  const eventTime = Math.floor(Date.parse(event.event_time) / 1000)
  if (!Number.isFinite(eventTime)) {
    throw new Error('Meta event_time must be a valid timestamp')
  }

  const customData = new CustomData().setCustomProperties(
    customProperties
  )
  const serverEvent = new ServerEvent()

  serverEvent
    .setEventName(metaEventName)
    .setEventTime(eventTime)
    .setUserData(buildMetaUserData(event))
    .setCustomData(customData)
    .setActionSource('website')
    .setEventId(event.event_id)
  serverEvent.setRequestContext(
    buildMetaRequestContext(event),
    metaMarketingRequestContextPreference
  )

  return serverEvent
}
