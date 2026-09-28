import {
  CustomData,
  ServerEvent
} from 'facebook-nodejs-business-sdk'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import { buildMetaUserData } from './buildMetaUserData'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

type MetaLeadEvent = CanonicalEventEnvelope & {
  page_url?: string | undefined
  referrer_url?: string | undefined
  custom_data: {
    currency?: string | undefined
    value?: number | undefined
  }
}

export function mapCanonicalLeadToMeta(
  event: MetaLeadEvent
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
    .setEventName('Lead')
    .setEventTime(eventTime)
    .setUserData(buildMetaUserData(event))
    .setActionSource('website')
    .setEventId(event.event_id)

  const leadValue = event.custom_data.value
  if (
    event.custom_data.currency &&
    leadValue !== undefined &&
    Number.isFinite(leadValue) &&
    leadValue > 0
  ) {
    serverEvent.setCustomData(
      new CustomData()
        .setCurrency(event.custom_data.currency)
        .setValue(leadValue)
    )
  }

  if (event.page_url) {
    serverEvent.setRequestContext(
      buildMetaRequestContext({ ...event, page_url: event.page_url }),
      metaMarketingRequestContextPreference
    )
  }

  return serverEvent
}
