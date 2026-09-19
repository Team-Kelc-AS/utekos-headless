import * as z from '@/lib/validation/zodMini'
import {
  canonicalCommerceItemSchema,
  canonicalCommerceValueSchema
} from './canonicalCommerceItem'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalViewItemListCustomDataSchema = z
  .extend(canonicalCommerceValueSchema, {
    impression_sequence: z.number().check(z.int(), z.gt(0)),
    item_list_id: z.string().check(z.minLength(1)),
    item_list_name: z.string().check(z.minLength(1)),
    items: z
      .array(canonicalCommerceItemSchema)
      .check(z.minLength(1), z.maxLength(20)),
    total_item_count: z.number().check(z.int(), z.gt(0))
  })
  .check(
    z.superRefine((value, context) => {
      if (value.total_item_count < value.items.length) {
        context.addIssue({
          code: 'custom',
          message:
            'total_item_count cannot be less than items.length',
          path: ['total_item_count']
        })
      }
    })
  )

export type CanonicalViewItemListCustomData = z.infer<
  typeof canonicalViewItemListCustomDataSchema
>

export const canonicalViewItemListSchema = z.extend(
  canonicalEventEnvelopeSchema,
  {
    event_name: z.literal('view_item_list'),
    source: z.literal('web'),
    page_url: z.string().check(z.url()),
    referrer_url: z.optional(z.string().check(z.url())),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.string().check(z.uuid()),
    custom_data: canonicalViewItemListCustomDataSchema
  }
)

export type CanonicalViewItemList = z.infer<
  typeof canonicalViewItemListSchema
>

type CreateCanonicalViewItemListInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalViewItemListCustomData
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

export type ViewItemListDataLayerEvent = {
  event: 'view_item_list'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalViewItemListCustomData
  canonical_event: CanonicalViewItemList
}

export function createCanonicalViewItemList(
  input: CreateCanonicalViewItemListInput
): CanonicalViewItemList {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalViewItemListSchema.parse({
    schema_version: 1,
    event_name: 'view_item_list',
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

export function buildViewItemListDataLayerEvent(
  event: CanonicalViewItemList
): ViewItemListDataLayerEvent {
  return {
    event: 'view_item_list',
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
