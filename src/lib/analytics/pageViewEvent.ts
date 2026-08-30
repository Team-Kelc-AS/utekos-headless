import { z } from 'zod'
import {
  canonicalEventEnvelopeSchema,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import {
  mapEventDeviceInfo,
  type EventDeviceInfoInput
} from './mapEventDeviceInfo'

export const canonicalPageViewSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('page_view'),
    source: z.literal('web'),
    edge_request_id: z.string().uuid().optional(),
    page_view_id: z.string().uuid(),
    page_url: z.string().url(),
    referrer_url: z.string().url().optional(),
    page_title: z.string().min(1),
    custom_data: z.record(z.string(), z.unknown()).optional()
  })

export type { ConsentSnapshot } from './canonicalEventEnvelope'
export type CanonicalPageView = z.infer<typeof canonicalPageViewSchema>
export type TrackingEnvironment = CanonicalPageView['environment']

type CreateCanonicalPageViewInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  environment: CanonicalPageView['environment']
  eventId: string
  edgeRequestId?: string
  externalId?: string
  impressionId?: string
  pageViewId: string
  eventTime: string
  pageUrl: string
  referrerUrl?: string
  pageTitle: string
  consent: ConsentSnapshot
  eventDeviceInfo?: EventDeviceInfoInput
}

type ReleaseCanonicalPageViewInput = {
  event: CanonicalPageView
  consent: ConsentSnapshot
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  externalId?: string
}

type ShouldReleaseCanonicalPageViewInput = Pick<
  ReleaseCanonicalPageViewInput,
  'event' | 'consent'
>

export type PageViewDataLayerEvent = {
  event: 'page_view'
  event_id: string
  event_time: string
  page_view_id?: string
  page_location: string
  page_referrer?: string
  page_title: string
  source: 'web'
  canonical_event: CanonicalPageView
}

type PageViewNavigationInput = {
  currentUrl: string
  documentReferrer: string
  previousUrl: string | null
}

export type PageViewNavigation = {
  pageUrl: string
  referrerUrl?: string
}

export function createCanonicalPageView(
  input: CreateCanonicalPageViewInput
): CanonicalPageView {
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonicalPageViewSchema.parse({
    schema_version: 1,
    event_name: 'page_view',
    event_id: input.eventId,
    ...(input.edgeRequestId ?
      { edge_request_id: input.edgeRequestId }
    : {}),
    page_view_id: input.pageViewId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    page_url: input.pageUrl,
    ...(input.referrerUrl ? { referrer_url: input.referrerUrl } : {}),
    page_title: input.pageTitle,
    consent: input.consent,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ? { external_id: input.externalId } : {}),
    ...(input.impressionId ? { impression_id: input.impressionId } : {}),
    ...(eventDeviceInfo ? { event_device_info: eventDeviceInfo } : {})
  })
}

/**
 * Reuses the canonical identity captured at landing time while replacing the
 * pre-consent identity envelope with the identifiers that are eligible after
 * the visitor grants marketing consent.
 */
export function releaseCanonicalPageViewForConsent(
  input: ReleaseCanonicalPageViewInput
): CanonicalPageView {
  const {
    browser_id: _capturedBrowserId,
    click_id: _capturedClickId,
    external_id: _capturedExternalId,
    ...capturedEvent
  } = input.event

  return canonicalPageViewSchema.parse({
    ...capturedEvent,
    consent: input.consent,
    ...(input.browserId ?
      { browser_id: input.browserId }
    : {}),
    ...(input.clickId ?
      { click_id: input.clickId }
    : {}),
    ...(input.externalId ?
      { external_id: input.externalId }
    : {})
  })
}

export function shouldReleaseCanonicalPageViewForConsent(
  input: ShouldReleaseCanonicalPageViewInput
) {
  return (
    input.event.consent.marketing !== 'granted' &&
    input.consent.marketing === 'granted'
  )
}

export function buildPageViewDataLayerEvent(
  event: CanonicalPageView
): PageViewDataLayerEvent {
  return {
    event: 'page_view',
    event_id: event.event_id,
    event_time: event.event_time,
    page_view_id: event.page_view_id,
    page_location: event.page_url,
    ...(event.referrer_url ? { page_referrer: event.referrer_url } : {}),
    page_title: event.page_title,
    source: event.source,
    canonical_event: event
  }
}

export function resolvePageViewNavigation(
  input: PageViewNavigationInput
): PageViewNavigation | null {
  if (input.currentUrl === input.previousUrl) return null

  if (
    input.previousUrl &&
    pageResource(input.currentUrl) ===
      pageResource(input.previousUrl)
  ) {
    return null
  }

  const referrerUrl = input.previousUrl || input.documentReferrer

  return {
    pageUrl: input.currentUrl,
    ...(referrerUrl ? { referrerUrl } : {})
  }
}

function pageResource(value: string) {
  const url = new URL(value)

  return `${url.origin}${url.pathname}`
}
