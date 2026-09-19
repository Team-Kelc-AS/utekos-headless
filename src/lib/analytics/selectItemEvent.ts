import * as z from '@/lib/validation/zodMini'
import { canonicalCommerceItemSchema } from './canonicalCommerceItem'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalSelectItemCustomDataSchema =
  z.strictObject({
    interaction_id: z.string().check(z.minLength(1)),
    item_list_id: z.string().check(z.minLength(1)),
    destination_url: z.optional(z.string().check(z.url())),
    currency: z.string().check(z.regex(/^[A-Z]{3}$/)),
    value: z.number().check(z.gte(0)),
    gross_value: z.number().check(z.gte(0)),
    tax_value: z.number().check(z.gte(0)),
    items: z
      .array(canonicalCommerceItemSchema)
      .check(z.minLength(1), z.maxLength(1))
  })

export type CanonicalSelectItemCustomData = z.infer<
  typeof canonicalSelectItemCustomDataSchema
>

export const canonicalSelectItemSchema = z.extend(
  canonicalEventEnvelopeSchema,
  {
    event_name: z.literal('select_item'),
    source: z.literal('web'),
    page_url: z.string().check(z.url()),
    referrer_url: z.optional(z.string().check(z.url())),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.optional(z.string().check(z.uuid())),
    custom_data: canonicalSelectItemCustomDataSchema
  }
)

export type CanonicalSelectItem = z.infer<
  typeof canonicalSelectItemSchema
>

type CreateCanonicalSelectItemInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalSelectItemCustomData
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: Parameters<typeof mapEventDeviceInfo>[0]
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageTitle?: string
  pageUrl?: string
  pageViewId?: string
  referrerUrl?: string
}

export type SelectItemDataLayerEvent = {
  event: 'select_item'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalSelectItemCustomData
  canonical_event: CanonicalSelectItem
}

export function createCanonicalSelectItem(
  input: CreateCanonicalSelectItemInput
): CanonicalSelectItem {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalSelectItemSchema.parse({
    schema_version: 1,
    event_name: 'select_item',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    ...(input.pageUrl ? { page_url: input.pageUrl } : {}),
    ...(input.pageViewId ?
      { page_view_id: input.pageViewId }
    : {}),
    ...(input.referrerUrl ?
      { referrer_url: input.referrerUrl }
    : {}),
    ...(input.pageTitle ? { page_title: input.pageTitle } : {}),
    consent: input.consent,
    custom_data: input.customData,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ?
      { external_id: input.externalId }
    : {}),
    ...(input.impressionId ?
      { impression_id: input.impressionId }
    : {}),
    ...(eventDeviceInfo ?
      { event_device_info: eventDeviceInfo }
    : {})
  })
}

export function buildSelectItemDataLayerEvent(
  event: CanonicalSelectItem
): SelectItemDataLayerEvent {
  return {
    event: 'select_item',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    ...(event.page_view_id ?
      { page_view_id: event.page_view_id }
    : {}),
    custom_data: event.custom_data,
    canonical_event: event
  }
}
