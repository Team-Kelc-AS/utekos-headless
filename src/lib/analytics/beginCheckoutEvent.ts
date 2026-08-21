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

type EventDeviceInfoInput = {
  language?: string
  pixelRatio?: number
  platform?: string
  screenHeight?: number
  screenWidth?: number
  userAgent?: string
  viewportHeight?: number
  viewportWidth?: number
}

type CreateCanonicalBeginCheckoutInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  commerce: CanonicalBeginCheckoutCommerce
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
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonicalBeginCheckoutSchema.parse({
    schema_version: 1,
    event_name: 'begin_checkout',
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

function mapEventDeviceInfo(input: EventDeviceInfoInput | undefined) {
  if (!input) return undefined

  const deviceInfo = {
    ...(input.language ? { language: input.language } : {}),
    ...(input.pixelRatio === undefined ?
      {}
    : { pixel_ratio: input.pixelRatio }),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.screenHeight === undefined ?
      {}
    : { screen_height: input.screenHeight }),
    ...(input.screenWidth === undefined ?
      {}
    : { screen_width: input.screenWidth }),
    ...(input.userAgent ? { user_agent: input.userAgent } : {}),
    ...(input.viewportHeight === undefined ?
      {}
    : { viewport_height: input.viewportHeight }),
    ...(input.viewportWidth === undefined ?
      {}
    : { viewport_width: input.viewportWidth })
  }

  return Object.keys(deviceInfo).length > 0 ? deviceInfo : undefined
}

export type { CanonicalCommerceValue }
