import * as z from '@/lib/validation/zodMini'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const VIEW_CATEGORY_MAX_CONTENT_IDS = 10

export const canonicalViewCategoryCustomDataSchema =
  z.strictObject({
    category_id: z.string().check(z.minLength(1)),
    category_name: z.string().check(z.minLength(1)),
    content_ids: z.optional(
      z
        .array(z.string().check(z.regex(/^\d+$/)))
        .check(
          z.minLength(1),
          z.maxLength(VIEW_CATEGORY_MAX_CONTENT_IDS)
        )
    ),
    view_sequence: z.number().check(z.int(), z.gt(0))
  })

export type CanonicalViewCategoryCustomData = z.infer<
  typeof canonicalViewCategoryCustomDataSchema
>

export const canonicalViewCategorySchema = z.extend(
  canonicalEventEnvelopeSchema,
  {
    event_name: z.literal('view_category'),
    source: z.literal('web'),
    page_url: z.url(),
    referrer_url: z.optional(z.url()),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.uuid(),
    custom_data: canonicalViewCategoryCustomDataSchema
  }
)

export type CanonicalViewCategory = z.infer<
  typeof canonicalViewCategorySchema
>

type CreateCanonicalViewCategoryInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalViewCategoryCustomData
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: Parameters<typeof mapEventDeviceInfo>[0]
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageTitle: string
  pageUrl: string
  pageViewId: string
  referrerUrl?: string
}

export type ViewCategoryDataLayerEvent = {
  event: 'view_category'
  event_id: string
  event_time: string
  source: 'web'
  page_url: string
  page_view_id: string
  page_title: string
  referrer_url?: string
  custom_data: CanonicalViewCategoryCustomData
  canonical_event: CanonicalViewCategory
}

export function createCanonicalViewCategory(
  input: CreateCanonicalViewCategoryInput
): CanonicalViewCategory {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalViewCategorySchema.parse({
    schema_version: 1,
    event_name: 'view_category',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    page_view_id: input.pageViewId,
    ...(input.referrerUrl ?
      { referrer_url: input.referrerUrl }
    : {}),
    page_title: input.pageTitle,
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

export function buildViewCategoryDataLayerEvent(
  event: CanonicalViewCategory
): ViewCategoryDataLayerEvent {
  return {
    event: 'view_category',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    page_url: event.page_url,
    page_view_id: event.page_view_id,
    page_title: event.page_title,
    ...(event.referrer_url ?
      { referrer_url: event.referrer_url }
    : {}),
    custom_data: event.custom_data,
    canonical_event: event
  }
}
