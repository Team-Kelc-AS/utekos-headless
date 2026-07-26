import {
  Content,
  CustomData,
  ServerEvent
} from 'facebook-nodejs-business-sdk'
import type { CanonicalCommerceItem } from '../canonicalCommerceItem'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import { buildMetaUserData } from './buildMetaUserData'
import { buildMetaRequestContext } from './buildMetaRequestContext'
import { metaMarketingRequestContextPreference } from './metaMarketingRequestContextPreference'

const SHOPIFY_VARIANT_GID =
  /^gid:\/\/shopify\/ProductVariant\/(\d+)$/

type MetaCommerceEvent = CanonicalEventEnvelope & {
  page_url: string
  custom_data: {
    currency: string
    gross_value: number
    items: CanonicalCommerceItem[]
  }
}

function getMetaContentId(variantId: string) {
  const match = SHOPIFY_VARIANT_GID.exec(variantId)

  if (!match?.[1]) {
    throw new Error(
      'Meta content_id requires a Shopify ProductVariant GID'
    )
  }

  return match[1]
}

function buildContent(item: CanonicalCommerceItem) {
  const content = new Content()
    .setId(getMetaContentId(item.variant_id))
    .setQuantity(item.quantity)
    .setItemPrice(item.gross_unit_price)
    .setTitle(item.item_name)
  const category = item.item_category ?? item.product_type

  if (item.item_brand) content.setBrand(item.item_brand)
  if (category) content.setCategory(category)

  return content
}

function buildCustomData(
  event: MetaCommerceEvent,
  customProperties?: Record<
    string,
    boolean | number | string
  >
) {
  const items = event.custom_data.items
  const contentIds = items.map(item =>
    getMetaContentId(item.variant_id)
  )
  const contents = items.map(buildContent)
  const primaryItem = items[0]
  const customData = new CustomData()
    .setCurrency(event.custom_data.currency)
    .setValue(event.custom_data.gross_value)
    .setContentIds(contentIds)
    .setContents(contents)
    .setContentType('product')
    .setNumItems(
      items.reduce((sum, item) => sum + item.quantity, 0)
    )

  if (customProperties) {
    customData.setCustomProperties(customProperties)
  }

  if (primaryItem) {
    customData.setContentName(primaryItem.item_name)

    const category =
      primaryItem.item_category ?? primaryItem.product_type
    if (category) customData.setContentCategory(category)
  }

  return customData
}

export function mapCanonicalCommerceEventToMeta(
  event: MetaCommerceEvent,
  metaEventName: string,
  customProperties?: Record<string, boolean | number | string>
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
    .setEventName(metaEventName)
    .setEventTime(eventTime)
    .setUserData(buildMetaUserData(event))
    .setCustomData(buildCustomData(event, customProperties))
    .setActionSource('website')
    .setEventId(event.event_id)

  serverEvent.setRequestContext(
    buildMetaRequestContext(event),
    metaMarketingRequestContextPreference
  )
  return serverEvent
}
