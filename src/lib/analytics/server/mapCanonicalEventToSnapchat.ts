import { createHash } from 'node:crypto'
import type { CanonicalEvent } from '../canonicalEvent'
import {
  isSnapchatCanonicalEventName,
  SNAPCHAT_CANONICAL_EVENT_MAP,
  type SnapchatEventName
} from '../snapchatEventMapping'

type UnknownRecord = Record<string, unknown>

export type SnapchatUserData = {
  client_ip_address?: string
  client_user_agent?: string
  em?: string[]
  external_id?: string[]
  ph?: string[]
  sc_click_id?: string
  sc_cookie1?: string
}

export type SnapchatContent = {
  id: string
  item_price?: number
  quantity?: number
}

export type SnapchatCustomData = {
  content_ids?: string[]
  content_type?: 'product'
  contents?: SnapchatContent[]
  currency?: string
  num_items?: number
  order_id?: string
  value?: number
}

export type SnapchatConversionEvent = {
  action_source: 'WEB'
  custom_data?: SnapchatCustomData
  event_id: string
  event_name: SnapchatEventName
  event_source_url: string
  event_time: number
  user_data: SnapchatUserData
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value)
  )
}

function readString(input: UnknownRecord, key: string) {
  const value = input[key]
  return typeof value === 'string' && value.trim() ?
      value.trim()
    : undefined
}

function readFiniteNumber(input: UnknownRecord, key: string) {
  const value = input[key]
  return typeof value === 'number' && Number.isFinite(value) ?
      value
    : undefined
}

function readPositiveInteger(input: UnknownRecord, key: string) {
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

function sanitizeEventSourceUrl(value: string | undefined) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return undefined
    }
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return undefined
  }
}

function resolveEventSourceUrl(event: CanonicalEvent) {
  const sourceUrl = sanitizeEventSourceUrl(event.page_url)
  if (sourceUrl) return sourceUrl

  if (
    event.event_name === 'add_payment_info' ||
    event.event_name === 'purchase'
  ) {
    return 'https://kasse.utekos.no/'
  }

  return 'https://utekos.no/'
}

function readItems(customData: UnknownRecord) {
  return Array.isArray(customData.items) ?
      customData.items.filter(isRecord)
    : []
}

function mapContent(
  item: UnknownRecord
): SnapchatContent | null {
  const productId = readString(item, 'product_id')
  if (!productId) return null

  const gidMatch = /^gid:\/\/shopify\/Product\/([0-9]+)$/.exec(
    productId
  )
  const id =
    gidMatch?.[1] ??
    (/^[0-9]+$/.test(productId) ? productId : undefined)
  if (!id) return null

  const itemPrice =
    readFiniteNumber(item, 'final_unit_price') ??
    readFiniteNumber(item, 'unit_price')
  const quantity = readPositiveInteger(item, 'quantity')

  return {
    id,
    ...(itemPrice !== undefined ?
      { item_price: itemPrice }
    : {}),
    ...(quantity ? { quantity } : {})
  }
}

function resolveDedupeId(
  event: CanonicalEvent,
  customData: UnknownRecord | undefined
) {
  if (event.event_name === 'add_payment_info') {
    return customData ?
        (readString(customData, 'payment_revision') ??
          event.event_id)
      : event.event_id
  }

  if (event.event_name === 'purchase') {
    return customData ?
        (readString(customData, 'transaction_id') ??
          event.event_id)
      : event.event_id
  }

  return event.event_id
}

function mapCustomData(
  event: CanonicalEvent,
  customData: UnknownRecord | undefined
): SnapchatCustomData | undefined {
  if (!customData) return undefined

  const contents = readItems(customData)
    .map(mapContent)
    .filter(
      (content): content is SnapchatContent => content !== null
    )
  const contentIds = contents.map(content => content.id)
  const currency = readString(customData, 'currency')
  const value = readFiniteNumber(customData, 'value')
  const numItems = contents.reduce(
    (sum, content) => sum + (content.quantity ?? 1),
    0
  )
  const orderId =
    event.event_name === 'purchase' ?
      readString(customData, 'transaction_id')
    : undefined

  const mapped: SnapchatCustomData = {
    ...(contentIds.length > 0 ?
      {
        content_ids: contentIds,
        content_type: 'product' as const
      }
    : {}),
    ...(contents.length > 0 ? { contents } : {}),
    ...(currency ? { currency } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(numItems > 0 ? { num_items: numItems } : {}),
    ...(orderId ? { order_id: orderId } : {})
  }

  return Object.keys(mapped).length > 0 ? mapped : undefined
}

function buildUserData(event: CanonicalEvent): SnapchatUserData {
  const emailHashes = event.user_data?.email_sha256
  const phoneHashes = event.user_data?.phone_sha256
  const externalId =
    event.external_id ? sha256(event.external_id) : undefined
  const browserId = event.browser_id
  const scCookie = browserId?.sc_cookie1
  const scClickId = event.click_id?.sc_click_id
  const clientUserAgent = event.event_device_info?.user_agent

  return {
    ...(emailHashes?.length ? { em: emailHashes } : {}),
    ...(phoneHashes?.length ? { ph: phoneHashes } : {}),
    ...(externalId ? { external_id: [externalId] } : {}),
    ...(event.client_ip_address ?
      { client_ip_address: event.client_ip_address }
    : {}),
    ...(clientUserAgent ?
      { client_user_agent: clientUserAgent }
    : {}),
    ...(scClickId ? { sc_click_id: scClickId } : {}),
    ...(scCookie ? { sc_cookie1: scCookie } : {})
  }
}

export function hasSnapchatRequiredUserIdentity(
  userData: SnapchatUserData
) {
  return Boolean(
    userData.em?.length ||
    userData.ph?.length ||
    (userData.client_ip_address && userData.client_user_agent)
  )
}

export function hasSnapchatCanonicalUserIdentity(
  event: CanonicalEvent
) {
  return hasSnapchatRequiredUserIdentity(buildUserData(event))
}

export function mapCanonicalEventToSnapchat(
  event: CanonicalEvent
): SnapchatConversionEvent | null {
  if (!isSnapchatCanonicalEventName(event.event_name))
    return null

  const eventTime = Date.parse(event.event_time)
  if (!Number.isFinite(eventTime)) {
    throw new Error(
      `Invalid CanonicalEvent event_time for Snapchat: ${event.event_time}`
    )
  }

  const customData =
    'custom_data' in event && isRecord(event.custom_data) ?
      event.custom_data
    : undefined
  const mappedCustomData = mapCustomData(event, customData)

  return {
    event_name: SNAPCHAT_CANONICAL_EVENT_MAP[event.event_name],
    event_time: eventTime,
    event_source_url: resolveEventSourceUrl(event),
    action_source: 'WEB',
    event_id: resolveDedupeId(event, customData),
    user_data: buildUserData(event),
    ...(mappedCustomData ?
      { custom_data: mappedCustomData }
    : {})
  }
}
