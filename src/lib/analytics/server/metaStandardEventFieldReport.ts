import { eventCatalog } from '../eventCatalog'

export const metaStandardDrainEvents = {
  AddToCart: 'add_to_cart',
  Purchase: 'purchase',
  InitiateCheckout: 'begin_checkout',
  Lead: 'generate_lead',
  ViewContent: 'view_item'
} as const

export type MetaStandardDrainEventName =
  keyof typeof metaStandardDrainEvents

export type MetaStandardDrainCanonicalName =
  (typeof metaStandardDrainEvents)[MetaStandardDrainEventName]

const recommendedParameters = {
  AddToCart: ['content_type', 'contents'],
  Purchase: ['content_type', 'contents', 'num_items', 'order_id'],
  InitiateCheckout: ['contents', 'num_items'],
  Lead: ['currency', 'value'],
  ViewContent: ['contents']
} as const satisfies Record<
  MetaStandardDrainEventName,
  readonly string[]
>

export type MetaStandardEventFieldReport = {
  canonicalEventName: MetaStandardDrainCanonicalName
  complete: boolean
  eventId: string
  eventName: MetaStandardDrainEventName
  hasClientIp: boolean
  hasClientUserAgent: boolean
  hasEmail: boolean
  hasEventSourceUrl: boolean
  hasExternalId: boolean
  hasFbc: boolean
  hasFbp: boolean
  hasOrderId: boolean
  hasPhone: boolean
  hasUserData: boolean
  missingParameters: string[]
  parameters: Record<string, boolean | number | string>
  presentParameters: string[]
  recommendedMissing: string[]
  requiredParameters: string[]
  transport: {
    browser: string | null
    server: string | null
  }
}

function isPresent(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return false
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ?
      (value as Record<string, unknown>)
    : {}
}

export function isMetaStandardDrainEventName(
  value: string
): value is MetaStandardDrainEventName {
  return value in metaStandardDrainEvents
}

export function buildMetaStandardEventFieldReport(
  payload: Record<string, unknown>
): MetaStandardEventFieldReport | undefined {
  const eventName = payload.event_name
  if (
    typeof eventName !== 'string' ||
    !isMetaStandardDrainEventName(eventName)
  ) {
    return undefined
  }

  const canonicalEventName = metaStandardDrainEvents[eventName]
  const catalog = eventCatalog[canonicalEventName].providers.meta
  const requiredParameters = [...catalog.requiredParameters]
  const userData = record(payload.user_data)
  const customData = record(payload.custom_data)
  const available: Record<string, unknown> = {
    ...payload,
    ...customData,
    user_data: userData
  }
  const presentParameters = requiredParameters.filter(name =>
    isPresent(available[name])
  )
  const missingParameters = requiredParameters.filter(
    name => !isPresent(available[name])
  )
  const recommendedMissing = recommendedParameters[eventName].filter(
    name => !isPresent(available[name])
  )
  const eventId =
    typeof payload.event_id === 'string' && payload.event_id.trim() ?
      payload.event_id
    : 'missing'
  const contentIds = customData.content_ids
  const contents = customData.contents
  const parameters: Record<string, boolean | number | string> = {
    action_source:
      typeof payload.action_source === 'string' ?
        payload.action_source
      : 'missing'
  }

  if (typeof customData.currency === 'string') {
    parameters.currency = customData.currency
  }
  if (typeof customData.value === 'number') {
    parameters.value = customData.value
  }
  if (typeof customData.content_type === 'string') {
    parameters.content_type = customData.content_type
  }
  if (typeof customData.num_items === 'number') {
    parameters.num_items = customData.num_items
  }
  if (Array.isArray(contentIds)) {
    parameters.content_ids_count = contentIds.length
  }
  if (Array.isArray(contents)) {
    parameters.contents_count = contents.length
  }

  return {
    canonicalEventName,
    complete: missingParameters.length === 0,
    eventId,
    eventName,
    hasClientIp: isPresent(userData.client_ip_address),
    hasClientUserAgent: isPresent(userData.client_user_agent),
    hasEmail: isPresent(userData.em),
    hasEventSourceUrl: isPresent(payload.event_source_url),
    hasExternalId: isPresent(userData.external_id),
    hasFbc: isPresent(userData.fbc),
    hasFbp: isPresent(userData.fbp),
    hasOrderId: isPresent(customData.order_id),
    hasPhone: isPresent(userData.ph),
    hasUserData: isPresent(userData),
    missingParameters,
    parameters,
    presentParameters,
    recommendedMissing,
    requiredParameters,
    transport: {
      browser: catalog.transport.browser,
      server: catalog.transport.server
    }
  }
}
