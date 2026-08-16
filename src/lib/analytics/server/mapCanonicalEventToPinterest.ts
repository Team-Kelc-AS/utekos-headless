import { createHash } from 'node:crypto'
import type { CanonicalEvent } from '../canonicalEvent'
import { resolvePinterestCatalogProductId } from '../pinterestCatalogIdentity'
import {
  isPinterestCanonicalEventName,
  PINTEREST_CANONICAL_EVENT_MAP,
  type PinterestApiEventName
} from '../pinterestEventMapping'

type UnknownRecord = Record<string, unknown>

export type PinterestUserData = {
  client_ip_address?: string
  client_user_agent?: string
  click_id?: string
  em?: string[]
  external_id?: string
  ph?: string[]
}

export type PinterestContent = {
  id: string
  item_brand?: string
  item_category?: string
  item_name?: string
  item_price?: string
  quantity?: number
}

export type PinterestCustomData = {
  content_brand?: string
  content_category?: string
  content_ids?: string[]
  content_name?: string
  contents?: PinterestContent[]
  currency?: string
  num_items?: number
  order_id?: string
  search_string?: string
  value?: string
}

export type PinterestConversionEvent = {
  action_source: 'web'
  event_id: string
  event_name: PinterestApiEventName
  event_source_url?: string
  event_time: number
  opt_out: false
  partner_name: 'direct'
  user_data: PinterestUserData
  custom_data?: PinterestCustomData
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value)
  )
}

function readString(
  input: UnknownRecord,
  key: string
): string | undefined {
  const value = input[key]
  return typeof value === 'string' && value.trim() ?
      value.trim()
    : undefined
}

function readFiniteNumber(
  input: UnknownRecord,
  key: string
): number | undefined {
  const value = input[key]
  return typeof value === 'number' && Number.isFinite(value) ?
      value
    : undefined
}

function readPositiveInteger(
  input: UnknownRecord,
  key: string
): number | undefined {
  const value = readFiniteNumber(input, key)
  return (
      value !== undefined && Number.isInteger(value) && value > 0
    ) ?
      value
    : undefined
}

function sha256(value: string) {
  return createHash('sha256')
    .update(value.trim(), 'utf8')
    .digest('hex')
}

function readItems(customData: UnknownRecord) {
  const value = customData.items
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function resolveProductId(item: UnknownRecord) {
  const itemId = readString(item, 'item_id')

  if (!itemId) {
    return undefined
  }

  return resolvePinterestCatalogProductId({ item_id: itemId })
}

function mapContent(
  item: UnknownRecord
): PinterestContent | null {
  const id = resolveProductId(item)
  if (!id) return null

  const unitPrice =
    readFiniteNumber(item, 'final_unit_price') ??
    readFiniteNumber(item, 'unit_price')
  const quantity = readPositiveInteger(item, 'quantity')
  const itemName = readString(item, 'item_name')
  const itemBrand = readString(item, 'item_brand')
  const itemCategory =
    readString(item, 'item_category') ??
    readString(item, 'product_type')

  return {
    id,
    ...(itemName ? { item_name: itemName } : {}),
    ...(itemBrand ? { item_brand: itemBrand } : {}),
    ...(itemCategory ? { item_category: itemCategory } : {}),
    ...(unitPrice !== undefined ?
      { item_price: String(unitPrice) }
    : {}),
    ...(quantity ? { quantity } : {})
  }
}

function mapCustomData(
  event: CanonicalEvent
): PinterestCustomData | undefined {
  if (
    !('custom_data' in event) ||
    !isRecord(event.custom_data)
  ) {
    return undefined
  }

  const customData = event.custom_data
  const items = readItems(customData)
  const contents = items
    .map(mapContent)
    .filter(
      (content): content is PinterestContent => content !== null
    )
  const contentIds = contents.map(content => content.id)
  const currency = readString(customData, 'currency')
  const value = readFiniteNumber(customData, 'value')
  const transactionId = readString(customData, 'transaction_id')
  const quantity = contents.reduce(
    (sum, item) => sum + (item.quantity ?? 1),
    0
  )
  const firstItem = items[0]
  const firstName =
    firstItem ? readString(firstItem, 'item_name') : undefined
  const firstBrand =
    firstItem ? readString(firstItem, 'item_brand') : undefined
  const firstCategory =
    firstItem ?
      (readString(firstItem, 'item_category') ??
      readString(firstItem, 'product_type'))
    : undefined
  const searchString =
    readString(customData, 'search_string') ??
    readString(customData, 'search_query') ??
    readString(customData, 'search_term') ??
    readString(customData, 'query')

  const mapped: PinterestCustomData = {
    ...(currency ? { currency } : {}),
    ...(value !== undefined && value > 0 ?
      { value: String(value) }
    : {}),
    ...(quantity > 0 ? { num_items: quantity } : {}),
    ...(transactionId ? { order_id: transactionId } : {}),
    ...(contentIds.length > 0 ?
      { content_ids: contentIds }
    : {}),
    ...(contents.length > 0 ? { contents } : {}),
    ...(firstName ? { content_name: firstName } : {}),
    ...(firstBrand ? { content_brand: firstBrand } : {}),
    ...(firstCategory ?
      { content_category: firstCategory }
    : {}),
    ...(searchString ? { search_string: searchString } : {})
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined
}

function buildUserData(
  event: CanonicalEvent
): PinterestUserData {
  const emailHashes = event.user_data?.email_sha256
  const phoneHashes = event.user_data?.phone_sha256
  const clientUserAgent = event.event_device_info?.user_agent
  const epik = event.click_id?.epik
  const externalId =
    event.external_id ? sha256(event.external_id) : undefined

  return {
    ...(emailHashes?.length ? { em: emailHashes } : {}),
    ...(phoneHashes?.length ? { ph: phoneHashes } : {}),
    ...(event.client_ip_address ?
      { client_ip_address: event.client_ip_address }
    : {}),
    ...(clientUserAgent ?
      { client_user_agent: clientUserAgent }
    : {}),
    ...(epik ? { click_id: epik } : {}),
    ...(externalId ? { external_id: externalId } : {})
  }
}

export function hasPinterestRequiredUserIdentity(
  userData: PinterestUserData
) {
  return Boolean(
    userData.em?.length ||
    (userData.client_ip_address && userData.client_user_agent)
  )
}

export function hasPinterestCanonicalUserIdentity(
  event: CanonicalEvent
) {
  return hasPinterestRequiredUserIdentity({
    ...(event.user_data?.email_sha256 ?
      { em: event.user_data.email_sha256 }
    : {}),
    ...(event.client_ip_address ?
      { client_ip_address: event.client_ip_address }
    : {}),
    ...(event.event_device_info?.user_agent ?
      { client_user_agent: event.event_device_info.user_agent }
    : {})
  })
}

export function mapCanonicalEventToPinterest(
  event: CanonicalEvent
): PinterestConversionEvent | null {
  if (!isPinterestCanonicalEventName(event.event_name)) {
    return null
  }

  const eventTimeMs = Date.parse(event.event_time)
  if (!Number.isFinite(eventTimeMs)) {
    throw new Error(
      `Invalid CanonicalEvent event_time for Pinterest: ${event.event_time}`
    )
  }

  const userData = buildUserData(event)
  const customData = mapCustomData(event)

  return {
    event_name:
      PINTEREST_CANONICAL_EVENT_MAP[event.event_name].api,
    action_source: 'web',
    event_time: Math.floor(eventTimeMs / 1000),
    event_id: event.event_id,
    ...(event.page_url ?
      { event_source_url: event.page_url }
    : {}),
    opt_out: false,
    partner_name: 'direct',
    user_data: userData,
    ...(customData ? { custom_data: customData } : {})
  }
}
