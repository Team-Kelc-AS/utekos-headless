import {
  getEventCatalogEntry,
  type CatalogEventName
} from '@/lib/analytics/eventCatalog'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'
import { compactDefined } from './compactDefined'
import type {
  AppLogAdPlatform,
  AppLogAdPlatformEvent,
  AppLogAdPlatformEvents,
  AppLogJsonValue
} from 'types/observability/log/AppLogEntry'

const AD_PLATFORMS = [
  'google',
  'meta',
  'microsoft_uet',
  'pinterest'
] as const satisfies readonly AppLogAdPlatform[]

const SHOPIFY_VARIANT_GID =
  /^gid:\/\/shopify\/ProductVariant\/(\d+)$/

type CanonicalLogEvent = {
  consent?:
    | {
        analytics: 'denied' | 'granted'
        marketing: 'denied' | 'granted'
        preferences: 'denied' | 'granted'
        source: 'cookiebot'
        version: string
      }
    | undefined
  custom_data?:
    | {
        cart_mutation_id?: string | undefined
        currency?: string | undefined
        gross_value?: number | undefined
        items?: unknown[] | undefined
        value?: number | undefined
      }
    | undefined
  event_id?: string | undefined
  event_name?: string | undefined
  event_time?: string | undefined
  page_title?: string | undefined
  page_url?: string | undefined
  page_view_id?: string | undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ?
      value
    : undefined
}

function variantContentId(item: Record<string, unknown>) {
  const variantId = readString(item.variant_id)
  if (variantId) {
    const match = SHOPIFY_VARIANT_GID.exec(variantId)
    if (match?.[1]) return match[1]
  }

  return readString(item.item_id)
}

function mapLogItems(items: unknown[] | undefined) {
  if (!items || items.length === 0) return undefined

  const mapped = items.slice(0, 250).map(item => {
    if (!isRecord(item)) return {}

    return compactDefined({
      item_brand: readString(item.item_brand),
      item_category: readString(item.item_category),
      item_id: readString(item.item_id),
      item_name: readString(item.item_name),
      quantity: readFiniteNumber(item.quantity),
      unit_price:
        readFiniteNumber(item.unit_price) ??
        readFiniteNumber(item.gross_unit_price)
    })
  })

  return mapped as AppLogJsonValue[]
}

function mapContents(items: unknown[] | undefined) {
  if (!items || items.length === 0) return undefined

  const contents = items.slice(0, 250).flatMap(item => {
    if (!isRecord(item)) return []

    const id = variantContentId(item)
    if (!id) return []

    return [
      compactDefined({
        id,
        item_brand: readString(item.item_brand),
        item_category: readString(item.item_category),
        item_name: readString(item.item_name),
        item_price: readFiniteNumber(item.gross_unit_price),
        quantity: readFiniteNumber(item.quantity)
      })
    ]
  })

  return contents.length > 0 ? (contents as AppLogJsonValue[]) : undefined
}

function mapContentIds(items: unknown[] | undefined) {
  if (!items || items.length === 0) return undefined

  const contentIds = items.flatMap(item => {
    if (!isRecord(item)) return []
    const id = variantContentId(item)
    return id ? [id] : []
  })

  return contentIds.length > 0 ? contentIds : undefined
}

function quantitySum(items: unknown[] | undefined) {
  if (!items) return undefined

  const total = items.reduce<number>((sum, item) => {
    if (!isRecord(item)) return sum
    return sum + (readFiniteNumber(item.quantity) ?? 0)
  }, 0)

  return total > 0 ? total : undefined
}

function sanitizedPagePath(pageUrl: string | undefined) {
  return pageUrl ? sanitizeOperationalPathname(pageUrl) : undefined
}

function commerceValue(event: CanonicalLogEvent, preferGross: boolean) {
  const customData = event.custom_data
  if (!customData) return undefined

  if (preferGross) {
    return customData.gross_value ?? customData.value
  }

  return customData.value ?? customData.gross_value
}

function buildPlatformParameters(
  platform: AppLogAdPlatform,
  event: CanonicalLogEvent
): Record<string, AppLogJsonValue> {
  const customData = event.custom_data
  const items = customData?.items
  const eventId = readString(event.event_id)
  const eventTime = readString(event.event_time)
  const pagePath = sanitizedPagePath(event.page_url)
  const pageTitle = readString(event.page_title)
  const currency = readString(customData?.currency)
  const mappedItems = mapLogItems(items)
  const contents = mapContents(items)
  const contentIds = mapContentIds(items)
  const numItems = quantitySum(items)

  switch (platform) {
    case 'google':
      return compactDefined({
        currency,
        event_id: eventId,
        event_time: eventTime,
        items: mappedItems,
        page_location: pagePath,
        page_title: pageTitle,
        page_view_id: readString(event.page_view_id),
        transaction_id: eventId,
        value: commerceValue(event, false)
      })
    case 'meta':
      return compactDefined({
        action_source: 'website',
        content_category: items?.[0] && isRecord(items[0]) ?
          readString(items[0].item_category) ??
          readString(items[0].product_type)
        : undefined,
        content_ids: contentIds,
        content_name:
          items?.[0] && isRecord(items[0]) ?
            readString(items[0].item_name)
          : undefined,
        content_type: 'product',
        contents,
        currency,
        event_id: eventId,
        event_source_url: pagePath,
        event_time: eventTime,
        num_items: numItems,
        value: commerceValue(event, true)
      })
    case 'microsoft_uet':
      return compactDefined({
        currency,
        ecommTotalValue: commerceValue(event, false),
        eventCategory: 'ecommerce',
        eventId,
        eventLabel: readString(customData?.cart_mutation_id) ?? eventId,
        eventTime,
        eventValue: commerceValue(event, false),
        itemIds: contentIds,
        items: mappedItems,
        pageLoadId: readString(event.page_view_id),
        pageType: 'product',
        transactionId: readString(customData?.cart_mutation_id) ?? eventId,
        value: commerceValue(event, false)
      })
    case 'pinterest':
      return compactDefined({
        content_ids: contentIds,
        contents,
        currency,
        event_id: eventId,
        event_source_url: pagePath,
        event_time: eventTime,
        num_items: numItems,
        value: commerceValue(event, true)
      })
    default: {
      const exhaustive: never = platform
      return exhaustive
    }
  }
}

export function buildAdPlatformLogEvents(input: {
  event: CanonicalLogEvent
  eventName: CatalogEventName
}): AppLogAdPlatformEvents | undefined {
  const catalog = getEventCatalogEntry(input.eventName)
  const events: AppLogAdPlatformEvents = {}

  for (const platform of AD_PLATFORMS) {
    const provider = catalog.providers[platform]
    if (!provider.eventName) continue
    if (
      provider.support !== 'supported' &&
      provider.support !== 'planned'
    ) {
      continue
    }

    const parameters = buildPlatformParameters(platform, input.event)
    const payload: AppLogAdPlatformEvent = {
      eventName: provider.eventName,
      requiredParameters: [...provider.requiredParameters],
      transport: {
        browser: provider.transport.browser,
        server: provider.transport.server
      },
      parameters
    }

    events[platform] = payload
  }

  return Object.keys(events).length > 0 ? events : undefined
}
