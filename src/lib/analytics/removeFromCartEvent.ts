import { z } from 'zod'
import { canonicalCommerceValueSchema } from './canonicalCommerceItem'
import { canonicalEventEnvelopeSchema, type CanonicalEventEnvelope, type ConsentSnapshot } from './canonicalEventEnvelope'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'

export const canonicalRemoveFromCartCustomDataSchema = canonicalCommerceValueSchema.extend({
  cart_mutation_id: z.string().min(1),
  cart_id: z.string().min(1)
})

export type CanonicalRemoveFromCartCustomData = z.infer<
  typeof canonicalRemoveFromCartCustomDataSchema
>

export const canonicalRemoveFromCartSchema = canonicalEventEnvelopeSchema
  .extend({
    event_name: z.literal('remove_from_cart'),
    source: z.enum(['web', 'webhook']),
    page_url: z.string().url().optional(),
    referrer_url: z.string().url().optional(),
    page_title: z.string().min(1).optional(),
    page_view_id: z.string().uuid().optional(),
    custom_data: canonicalRemoveFromCartCustomDataSchema
  })
  .superRefine((event, ctx) => {
    if (event.source !== 'web') return

    if (!event.page_url) {
      ctx.addIssue({
        code: 'custom',
        message: 'page_url is required for web remove_from_cart',
        path: ['page_url']
      })
    }

    if (!event.page_title) {
      ctx.addIssue({
        code: 'custom',
        message: 'page_title is required for web remove_from_cart',
        path: ['page_title']
      })
    }
  })

export type CanonicalRemoveFromCart = z.infer<typeof canonicalRemoveFromCartSchema>

type CreateCanonicalRemoveFromCartInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalRemoveFromCartCustomData
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: Parameters<typeof mapEventDeviceInfo>[0]
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageTitle: string
  pageUrl: string
  pageViewId?: string
  referrerUrl?: string
}

export type RemoveFromCartDataLayerEvent = {
  event: 'remove_from_cart'
  event_id: string
  event_time: string
  source: 'web'
  page_view_id?: string
  custom_data: CanonicalRemoveFromCartCustomData
  canonical_event: CanonicalRemoveFromCart
}

export function createCanonicalRemoveFromCart(
  input: CreateCanonicalRemoveFromCartInput
): CanonicalRemoveFromCart {
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonicalRemoveFromCartSchema.parse({
    schema_version: 1,
    event_name: 'remove_from_cart',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    page_title: input.pageTitle,
    ...(input.pageViewId ? { page_view_id: input.pageViewId } : {}),
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

export function buildRemoveFromCartDataLayerEvent(
  event: CanonicalRemoveFromCart
): RemoveFromCartDataLayerEvent {
  return {
    event: 'remove_from_cart',
    event_id: event.event_id,
    event_time: event.event_time,
    // dataLayer is browser-only; webhook-sourced rows never enter this builder.
    source: 'web',
    ...(event.page_view_id ? { page_view_id: event.page_view_id } : {}),
    custom_data: event.custom_data,
    canonical_event: event
  }
}
