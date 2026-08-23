import {
  Content,
  CustomData,
  ServerEvent
} from 'facebook-nodejs-business-sdk'
import { resolveMetaCatalogProductId } from '../metaCatalogIdentity'
import type { CanonicalPurchase } from '../purchaseEvent'
import { buildMetaUserData } from './buildMetaUserData'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

function buildPurchaseContent(
  item: CanonicalPurchase['custom_data']['items'][number]
) {
  return new Content()
    .setId(resolveMetaCatalogProductId(item.item_id))
    .setQuantity(item.quantity)
    .setItemPrice(item.final_unit_price ?? item.unit_price)
    .setTitle(item.item_name)
}

function buildPurchaseCustomData(event: CanonicalPurchase) {
  const items = event.custom_data.items
  const contentIds = items.map(item =>
    resolveMetaCatalogProductId(item.item_id)
  )
  const contents = items.map(buildPurchaseContent)
  const primaryItem = items[0]

  const customData = new CustomData()
    .setCurrency(event.custom_data.currency)
    .setValue(event.custom_data.value)
    .setContentIds(contentIds)
    .setContents(contents)
    .setContentType('product')

  if (primaryItem) {
    customData.setContentName(primaryItem.item_name)
  }

  return customData
}

export function mapCanonicalPurchaseToMeta(
  event: CanonicalPurchase
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
    .setEventName('Purchase')
    .setEventTime(eventTime)
    .setUserData(buildMetaUserData(event))
    .setCustomData(buildPurchaseCustomData(event))
    .setActionSource('website')
    .setEventId(event.event_id)

  if (event.page_url) {
    serverEvent.setRequestContext(
      buildMetaRequestContext({ ...event, page_url: event.page_url }),
      metaMarketingRequestContextPreference
    )
  }

  return serverEvent
}
