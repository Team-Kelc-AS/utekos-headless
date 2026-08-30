import { z } from 'zod'
import {
  canonicalCommerceValueSchema,
  type CanonicalCommerceValue
} from './canonicalCommerceItem'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { checkoutMethodSchema } from './checkoutMethod'
import {
  mapEventDeviceInfo,
  type EventDeviceInfoInput
} from './mapEventDeviceInfo'

export const canonicalBeginCheckoutCommerceSchema =
  canonicalCommerceValueSchema.extend({
    cart_id: z.string().min(1),
    checkout_id: z.string().min(1),
    creation_revision: z.string().min(1)
  })

export type CanonicalBeginCheckoutCommerce = z.infer<
  typeof canonicalBeginCheckoutCommerceSchema
>

export const canonicalBeginCheckoutSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('begin_checkout'),
    source: z.literal('web'),
    checkout_method: checkoutMethodSchema.optional(),
    page_view_id: z.uuid().optional(),
    page_url: z.url(),
    referrer_url: z.url().optional(),
    page_title: z.string().min(1),
    custom_data: canonicalBeginCheckoutCommerceSchema
  })

export type CanonicalBeginCheckout = z.infer<
  typeof canonicalBeginCheckoutSchema
>

type CreateCanonicalBeginCheckoutInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  commerce: CanonicalBeginCheckoutCommerce
  consent: ConsentSnapshot
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: EventDeviceInfoInput
  eventId: string
  eventTime: string
  experiment?: CanonicalEventEnvelope['experiment']
  externalId?: string
  impressionId?: string
  pageTitle: string
  pageUrl: string
  pageViewId?: string
  referrerUrl?: string
}

export type BeginCheckoutDataLayerEvent = {
  event: 'begin_checkout'
  event_id: string
  event_time: string
  source: 'web'
  transaction_id: string
  commerce: CanonicalBeginCheckoutCommerce
  canonical_event: CanonicalBeginCheckout
}

export function createCanonicalBeginCheckout(
  input: CreateCanonicalBeginCheckoutInput
): CanonicalBeginCheckout {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalBeginCheckoutSchema.parse({
    schema_version: 1,
    event_name: 'begin_checkout',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    ...(input.pageViewId ?
      { page_view_id: input.pageViewId }
    : {}),
    ...(input.referrerUrl ?
      { referrer_url: input.referrerUrl }
    : {}),
    page_title: input.pageTitle,
    consent: input.consent,
    ...(input.experiment ?
      { experiment: input.experiment }
    : {}),
    custom_data: input.commerce,
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

export function buildBeginCheckoutDataLayerEvent(
  event: CanonicalBeginCheckout
): BeginCheckoutDataLayerEvent {
  return {
    event: 'begin_checkout',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    transaction_id: event.event_id,
    commerce: event.custom_data,
    canonical_event: event
  }
}

export type { CanonicalCommerceValue }
