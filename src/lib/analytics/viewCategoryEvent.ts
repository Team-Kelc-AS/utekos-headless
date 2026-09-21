import { z } from 'zod'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const VIEW_CATEGORY_MAX_CONTENT_IDS = 10

export const canonicalViewCategoryCustomDataSchema =
  z.strictObject({
    category_id: z.string().min(1),
    category_name: z.string().min(1),
    content_ids: z
      .array(z.string().regex(/^\d+$/))
      .min(1)
      .max(VIEW_CATEGORY_MAX_CONTENT_IDS)
      .optional(),
    view_sequence: z.number().int().positive()
  })

export type CanonicalViewCategoryCustomData = z.infer<
  typeof canonicalViewCategoryCustomDataSchema
>

export const canonicalViewCategorySchema = z.strictObject({
  ...canonicalEventEnvelopeSchema.shape,
  event_name: z.literal('view_category'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid(),
  custom_data: canonicalViewCategoryCustomDataSchema
})

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
  pageTitle?: string
  pageUrl?: string
  pageViewId?: string
  referrerUrl?: string
}

export type ViewCategoryDataLayerEvent = {
  event: 'view_category'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
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

export function buildViewCategoryDataLayerEvent(
  event: CanonicalViewCategory
): ViewCategoryDataLayerEvent {
  return {
    event: 'view_category',
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
