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

export const canonicalViewItemCommerceSchema =
  canonicalCommerceValueSchema

export type CanonicalViewItemCommerce = CanonicalCommerceValue

export const canonicalViewItemSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('view_item'),
    source: z.literal('web'),
    page_view_id: z.string().uuid(),
    page_url: z.string().url(),
    referrer_url: z.string().url().optional(),
    page_title: z.string().min(1),
    custom_data: canonicalViewItemCommerceSchema
  })

export type CanonicalViewItem = z.infer<
  typeof canonicalViewItemSchema
>

type UserDataInput = {
  emailSha256?: string[]
  phoneSha256?: string[]
}

type CreateCanonicalViewItemInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  commerce: CanonicalViewItemCommerce
  consent: ConsentSnapshot
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: EventDeviceInfoInput
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  location?: NonNullable<CanonicalEventEnvelope['location']>
  pageTitle: string
  pageUrl: string
  pageViewId: string
  referrerUrl?: string
  userData?: UserDataInput
}

export type ViewItemDataLayerEvent = {
  event: 'view_item'
  event_id: string
  event_time: string
  page_view_id?: string
  source: 'web'
  transaction_id: string
  commerce: CanonicalViewItemCommerce
  canonical_event: CanonicalViewItem
}

export function createCanonicalViewItem(
  input: CreateCanonicalViewItemInput
): CanonicalViewItem {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )
  const userData = mapUserData(input.userData)

  return canonicalViewItemSchema.parse({
    schema_version: 1,
    event_name: 'view_item',
    event_id: input.eventId,
    page_view_id: input.pageViewId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    ...(input.referrerUrl ?
      { referrer_url: input.referrerUrl }
    : {}),
    page_title: input.pageTitle,
    consent: input.consent,
    custom_data: input.commerce,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ?
      { external_id: input.externalId }
    : {}),
    ...(input.impressionId ?
      { impression_id: input.impressionId }
    : {}),
    ...(input.location ? { location: input.location } : {}),
    ...(eventDeviceInfo ?
      { event_device_info: eventDeviceInfo }
    : {}),
    ...(userData ? { user_data: userData } : {})
  })
}

export function buildViewItemDataLayerEvent(
  event: CanonicalViewItem
): ViewItemDataLayerEvent {
  return {
    event: 'view_item',
    event_id: event.event_id,
    event_time: event.event_time,
    page_view_id: event.page_view_id,
    source: event.source,
    transaction_id: event.event_id,
    commerce: event.custom_data,
    canonical_event: event
  }
}

function mapUserData(input: UserDataInput | undefined) {
  if (!input) return undefined

  const userData = {
    ...(input.emailSha256 ?
      { email_sha256: input.emailSha256 }
    : {}),
    ...(input.phoneSha256 ?
      { phone_sha256: input.phoneSha256 }
    : {})
  }

  return Object.keys(userData).length > 0 ? userData : undefined
}
