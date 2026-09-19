import * as z from '@/lib/validation/zodMini'
import { canonicalCommerceItemSchema } from './canonicalCommerceItem'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalViewPromotionCustomDataSchema =
  z.strictObject({
    promotion_id: z.string().check(z.minLength(1)),
    promotion_name: z.optional(z.string().check(z.minLength(1))),
    creative_name: z.string().check(z.minLength(1)),
    creative_slot: z.optional(z.string().check(z.minLength(1))),
    impression_sequence: z.number().check(z.int(), z.gt(0)),
    items: z.optional(z.array(canonicalCommerceItemSchema))
  })

export type CanonicalViewPromotionCustomData = z.infer<
  typeof canonicalViewPromotionCustomDataSchema
>

export const canonicalViewPromotionSchema = z.extend(
  canonicalEventEnvelopeSchema,
  {
    event_name: z.literal('view_promotion'),
    source: z.literal('web'),
    page_url: z.string().check(z.url()),
    referrer_url: z.optional(z.string().check(z.url())),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.string().check(z.uuid()),
    custom_data: canonicalViewPromotionCustomDataSchema
  }
)

export type CanonicalViewPromotion = z.infer<
  typeof canonicalViewPromotionSchema
>

type CreateCanonicalViewPromotionInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalViewPromotionCustomData
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

export type ViewPromotionDataLayerEvent = {
  event: 'view_promotion'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalViewPromotionCustomData
  canonical_event: CanonicalViewPromotion
}

export function createCanonicalViewPromotion(
  input: CreateCanonicalViewPromotionInput
): CanonicalViewPromotion {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalViewPromotionSchema.parse({
    schema_version: 1,
    event_name: 'view_promotion',
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

export function buildViewPromotionDataLayerEvent(
  event: CanonicalViewPromotion
): ViewPromotionDataLayerEvent {
  return {
    event: 'view_promotion',
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
