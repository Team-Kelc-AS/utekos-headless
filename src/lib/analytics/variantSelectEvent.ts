import * as z from '@/lib/validation/zodMini'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalVariantSelectCustomDataSchema =
  z.strictObject({
    interaction_id: z.string().check(z.minLength(1)),
    product_id: z.string().check(z.minLength(1)),
    variant_id: z.string().check(z.minLength(1)),
    item_id: z.string().check(z.minLength(1)),
    item_variant: z.string().check(z.minLength(1)),
    availability: z.enum(['available', 'unavailable'])
  })

export type CanonicalVariantSelectCustomData = z.infer<
  typeof canonicalVariantSelectCustomDataSchema
>

export const canonicalVariantSelectSchema = z.extend(
  canonicalEventEnvelopeSchema,
  {
    event_name: z.literal('variant_select'),
    source: z.literal('web'),
    page_url: z.string().check(z.url()),
    referrer_url: z.optional(z.string().check(z.url())),
    page_title: z.string().check(z.minLength(1)),
    page_view_id: z.optional(z.string().check(z.uuid())),
    custom_data: canonicalVariantSelectCustomDataSchema
  }
)

export type CanonicalVariantSelect = z.infer<
  typeof canonicalVariantSelectSchema
>

type CreateCanonicalVariantSelectInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalVariantSelectCustomData
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

export type VariantSelectDataLayerEvent = {
  event: 'variant_select'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalVariantSelectCustomData
  canonical_event: CanonicalVariantSelect
}

export function createCanonicalVariantSelect(
  input: CreateCanonicalVariantSelectInput
): CanonicalVariantSelect {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalVariantSelectSchema.parse({
    schema_version: 1,
    event_name: 'variant_select',
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

export function buildVariantSelectDataLayerEvent(
  event: CanonicalVariantSelect
): VariantSelectDataLayerEvent {
  return {
    event: 'variant_select',
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
