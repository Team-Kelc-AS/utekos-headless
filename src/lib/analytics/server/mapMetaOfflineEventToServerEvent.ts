import 'server-only'

import {
  Content,
  CustomData
} from 'facebook-nodejs-business-sdk'
import {
  metaOfflineEventSchema,
  type MetaOfflineEvent
} from '../metaNonWebEventContract'
import { buildMetaObservedUserData } from './buildMetaObservedUserData'
import { ExactMetaServerEvent } from './ExactMetaServerEvent'
import {
  readMetaConversionsApiConfig,
  sendMetaServerEvent,
  type MetaConversionsApiConfig,
  type MetaSendResult
} from './sendMetaServerEvent'

function setOfflineMatchKeys(
  userData: ReturnType<typeof buildMetaObservedUserData>,
  event: MetaOfflineEvent
) {
  const observed = event.user_data

  if (observed.city_sha256) {
    userData.setCities(observed.city_sha256)
  }
  if (observed.country_sha256) {
    userData.setCountries(observed.country_sha256)
  }
  if (observed.date_of_birth_sha256) {
    userData.setDatesOfBirth(observed.date_of_birth_sha256)
  }
  if (observed.first_name_sha256) {
    userData.setFirstNames(observed.first_name_sha256)
  }
  if (observed.gender_sha256) {
    userData.setGenders(observed.gender_sha256)
  }
  if (observed.last_name_sha256) {
    userData.setLastNames(observed.last_name_sha256)
  }
  if (observed.postal_code_sha256) {
    userData.setZips(observed.postal_code_sha256)
  }
  if (observed.state_sha256) {
    userData.setStates(observed.state_sha256)
  }
  if (observed.lead_id) userData.setLeadId(observed.lead_id)
  if (observed.madid) userData.setMadid(observed.madid)
}

function buildOfflineCustomData(event: MetaOfflineEvent) {
  if (!event.custom_data) return undefined

  const {
    content_ids: contentIds,
    content_type: contentType,
    contents,
    currency,
    order_id: orderId,
    value,
    ...customProperties
  } = event.custom_data
  const customData = new CustomData()

  if (contentIds) customData.setContentIds(contentIds)
  if (contentType) customData.setContentType(contentType)
  if (currency) customData.setCurrency(currency)
  if (orderId) customData.setOrderId(orderId)
  if (value !== undefined) customData.setValue(value)
  if (contents) {
    customData.setContents(
      contents.map(item => {
        const content = new Content()
          .setId(item.id)
          .setQuantity(item.quantity)

        if (item.item_price !== undefined) {
          content.setItemPrice(item.item_price)
        }
        if (item.title) content.setTitle(item.title)
        if (item.brand) content.setBrand(item.brand)
        if (item.category) content.setCategory(item.category)

        return content
      })
    )
  }
  if (Object.keys(customProperties).length > 0) {
    customData.setCustomProperties(customProperties)
  }

  return customData
}

export function mapMetaOfflineEventToServerEvent(
  rawEvent: MetaOfflineEvent
): ExactMetaServerEvent {
  const event = metaOfflineEventSchema.parse(rawEvent)
  const userData = buildMetaObservedUserData(event.user_data)
  const customData = buildOfflineCustomData(event)
  const serverEvent = new ExactMetaServerEvent({
    topLevel: {
      ...(event.opt_out === undefined ?
        {}
      : { opt_out: event.opt_out }),
      ...(event.original_event_data ?
        { original_event_data: event.original_event_data }
      : {})
    }
  })

  setOfflineMatchKeys(userData, event)
  serverEvent
    .setEventName(event.event_name)
    .setEventTime(event.event_time)
    .setEventId(event.event_id)
    .setActionSource('physical_store')
    .setUserData(userData)

  if (customData) serverEvent.setCustomData(customData)

  return serverEvent
}

export async function sendMetaOfflineEvent(
  event: MetaOfflineEvent,
  config: MetaConversionsApiConfig = readMetaConversionsApiConfig()
): Promise<MetaSendResult> {
  return sendMetaServerEvent(
    mapMetaOfflineEventToServerEvent(event),
    config
  )
}
