import { z } from 'zod'
import { canonicalCommerceValueSchema } from './canonicalCommerceItem'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalAddToWishlistCustomDataSchema =
  z.strictObject({
    ...canonicalCommerceValueSchema.shape,
    wishlist_mutation_id: z.string().min(1)
  })

export type CanonicalAddToWishlistCustomData = z.infer<
  typeof canonicalAddToWishlistCustomDataSchema
>

export const canonicalAddToWishlistSchema = z.strictObject({
  ...canonicalEventEnvelopeSchema.shape,
  event_name: z.literal('add_to_wishlist'),
  source: z.literal('web'),
  page_url: z.string().url(),
  referrer_url: z.string().url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.string().uuid().optional(),
  custom_data: canonicalAddToWishlistCustomDataSchema
})

export type CanonicalAddToWishlist = z.infer<
  typeof canonicalAddToWishlistSchema
>

type CreateCanonicalAddToWishlistInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalAddToWishlistCustomData
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

export type AddToWishlistDataLayerEvent = {
  event: 'add_to_wishlist'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalAddToWishlistCustomData
  canonical_event: CanonicalAddToWishlist
}

export function createCanonicalAddToWishlist(
  input: CreateCanonicalAddToWishlistInput
): CanonicalAddToWishlist {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )

  return canonicalAddToWishlistSchema.parse({
    schema_version: 1,
    event_name: 'add_to_wishlist',
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

export function buildAddToWishlistDataLayerEvent(
  event: CanonicalAddToWishlist
): AddToWishlistDataLayerEvent {
  return {
    event: 'add_to_wishlist',
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
