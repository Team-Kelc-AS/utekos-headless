import {
  CustomData,
  ServerEvent
} from 'facebook-nodejs-business-sdk'
import type { CanonicalPageView } from '../pageViewEvent'
import { buildMetaUserData } from './buildMetaUserData'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

export function mapCanonicalPageViewToMeta(
  event: CanonicalPageView
): ServerEvent {
  if (event.consent.marketing !== 'granted') {
    throw new Error(
      'Meta dispatch requires granted marketing consent'
    )
  }

  const eventTime = Math.floor(
    Date.parse(event.event_time) / 1000
  )
  if (!Number.isFinite(eventTime)) {
    throw new Error('Meta event_time must be a valid timestamp')
  }

  const serverEvent = new ServerEvent()
  serverEvent
    .setEventName('PageView')
    .setEventTime(eventTime)
    .setUserData(buildMetaUserData(event))
    .setCustomData(
      new CustomData().setCustomProperties({ country: 'Norway' })
    )
    .setActionSource('website')
    .setEventId(event.event_id)

  serverEvent.setRequestContext(
    buildMetaRequestContext(event),
    metaMarketingRequestContextPreference
  )
  return serverEvent
}
