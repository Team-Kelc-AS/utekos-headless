import {
  CustomData,
  ServerEvent
} from 'facebook-nodejs-business-sdk'
import type { CanonicalViewCategory } from '../viewCategoryEvent'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { buildMetaUserData } from './buildMetaUserData'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

export function mapCanonicalViewCategoryToMeta(
  event: CanonicalViewCategory
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

  const customData = new CustomData()
    .setContentName(event.custom_data.category_name)
    .setContentCategory(event.custom_data.category_id)
    .setCustomProperties({
      category_id: event.custom_data.category_id,
      category_name: event.custom_data.category_name,
      view_sequence: event.custom_data.view_sequence
    })
  const contentIds = event.custom_data.content_ids

  if (contentIds && contentIds.length > 0) {
    customData.setContentIds(contentIds).setContentType('product')
  }

  const serverEvent = new ServerEvent()

  serverEvent
    .setEventName('ViewCategory')
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
