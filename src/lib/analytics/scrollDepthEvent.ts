import * as z from '@/lib/validation/zodMini'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalScrollDepthCustomDataSchema =
  z.strictObject({
    threshold: z.union([
      z.literal(25),
      z.literal(50),
      z.literal(75),
      z.literal(90)
    ]),
    percent_scrolled: z
      .number()
      .check(z.int(), z.gte(1), z.lte(100)),
    document_height: z.number().check(z.int(), z.gt(0))
  })

export type CanonicalScrollDepthCustomData = z.infer<
  typeof canonicalScrollDepthCustomDataSchema
>

export const canonicalScrollDepthSchema = z.extend(
  canonicalEventEnvelopeSchema,
  {
    event_name: z.literal('scroll_depth'),
    source: z.literal('web'),
    page_url: z.string().check(z.url()),
    referrer_url: z.optional(z.string().check(z.url())),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.string().check(z.uuid()),
    custom_data: canonicalScrollDepthCustomDataSchema
  }
)

export type CanonicalScrollDepth = z.infer<
  typeof canonicalScrollDepthSchema
>

type CreateCanonicalScrollDepthInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalScrollDepthCustomData
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

export type ScrollDepthDataLayerEvent = {
  event: 'scroll_depth'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalScrollDepthCustomData
  canonical_event: CanonicalScrollDepth
}

export function createCanonicalScrollDepth(
  input: CreateCanonicalScrollDepthInput
): CanonicalScrollDepth {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalScrollDepthSchema.parse({
    schema_version: 1,
    event_name: 'scroll_depth',
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

export function buildScrollDepthDataLayerEvent(
  event: CanonicalScrollDepth
): ScrollDepthDataLayerEvent {
  return {
    event: 'scroll_depth',
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
