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
import {
  mapEventDeviceInfo,
  type EventDeviceInfoInput
} from './mapEventDeviceInfo'

export const canonicalAddToCartCommerceSchema =
  canonicalCommerceValueSchema.extend({
    cart_mutation_id: z.string().min(1),
    cart_id: z.string().min(1)
  })

export type CanonicalAddToCartCommerce = z.infer<
  typeof canonicalAddToCartCommerceSchema
>

export const canonicalAddToCartSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('add_to_cart'),
    source: z.literal('web'),
    page_view_id: z.uuid().optional(),
    page_url: z.url(),
    referrer_url: z.url().optional(),
    page_title: z.string().min(1),
    custom_data: canonicalAddToCartCommerceSchema
  })

export type CanonicalAddToCart = z.infer<
  typeof canonicalAddToCartSchema
>

type CreateCanonicalAddToCartInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  commerce: CanonicalAddToCartCommerce
  consent: ConsentSnapshot
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: EventDeviceInfoInput
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageTitle: string
  pageUrl: string
  pageViewId?: string
  referrerUrl?: string
}

export type AddToCartDataLayerEvent = {
  event: 'add_to_cart'
  event_id: string
  event_time: string
  source: 'web'
  transaction_id: string
  commerce: CanonicalAddToCartCommerce
  canonical_event: CanonicalAddToCart
}

export function createCanonicalAddToCart(
  input: CreateCanonicalAddToCartInput
): CanonicalAddToCart {
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonicalAddToCartSchema.parse({
    schema_version: 1,
    event_name: 'add_to_cart',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    ...(input.pageViewId ? { page_view_id: input.pageViewId } : {}),
    ...(input.referrerUrl ? { referrer_url: input.referrerUrl } : {}),
    page_title: input.pageTitle,
    consent: input.consent,
    custom_data: input.commerce,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ? { external_id: input.externalId } : {}),
    ...(input.impressionId ?
      { impression_id: input.impressionId }
    : {}),
    ...(eventDeviceInfo ? { event_device_info: eventDeviceInfo } : {})
  })
}

export function buildAddToCartDataLayerEvent(
  event: CanonicalAddToCart
): AddToCartDataLayerEvent {
  return {
    event: 'add_to_cart',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    transaction_id: event.event_id,
    commerce: event.custom_data,
    canonical_event: event
  }
}

export type { CanonicalCommerceValue }
