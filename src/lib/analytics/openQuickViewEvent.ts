import { z } from 'zod'
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

export const canonicalOpenQuickViewCustomDataSchema =
  canonicalCommerceValueSchema.extend({
    items: z.array(canonicalCommerceItemSchema).length(1),
    open_sequence: z.number().int().positive(),
    source_surface: z.string().min(1)
  })

export type CanonicalOpenQuickViewCustomData = z.infer<
  typeof canonicalOpenQuickViewCustomDataSchema
>

export const canonicalOpenQuickViewSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('open_quick_view'),
    source: z.literal('web'),
    page_url: z.string().url(),
    referrer_url: z.string().url().optional(),
    page_title: z.string().min(1),
    page_view_id: z.string().uuid(),
    custom_data: canonicalOpenQuickViewCustomDataSchema
  })

export type CanonicalOpenQuickView = z.infer<
  typeof canonicalOpenQuickViewSchema
>

type CreateCanonicalOpenQuickViewInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalOpenQuickViewCustomData
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

export type OpenQuickViewDataLayerEvent = {
  canonical_event: CanonicalOpenQuickView
  custom_data: CanonicalOpenQuickViewCustomData
  event: 'open_quick_view'
  event_id: string
  event_time: string
  page_view_id: string
  source: 'web'
}

export function createCanonicalOpenQuickView(
  input: CreateCanonicalOpenQuickViewInput
): CanonicalOpenQuickView {
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonicalOpenQuickViewSchema.parse({
    schema_version: 1,
    event_name: 'open_quick_view',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    page_view_id: input.pageViewId,
    page_title: input.pageTitle,
    ...(input.referrerUrl ? { referrer_url: input.referrerUrl } : {}),
    consent: input.consent,
    custom_data: input.customData,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ? { external_id: input.externalId } : {}),
    ...(input.impressionId ? { impression_id: input.impressionId } : {}),
    ...(eventDeviceInfo ? { event_device_info: eventDeviceInfo } : {})
  })
}

export function buildOpenQuickViewDataLayerEvent(
  event: CanonicalOpenQuickView
): OpenQuickViewDataLayerEvent {
  return {
    canonical_event: event,
    custom_data: event.custom_data,
    event: 'open_quick_view',
    event_id: event.event_id,
    event_time: event.event_time,
    page_view_id: event.page_view_id,
    source: event.source
  }
}
