import { z } from 'zod'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import { gaWebVitalIntegerValue } from './gaWebVitalIntegerValue'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'
import { webVitalMetricNameSchema, type WebVitalMetricName } from './webVitalMetricName'

export const webVitalRatingSchema = z.enum([
  'good',
  'needs-improvement',
  'poor'
])

export const canonicalWebVitalCustomDataSchema = z.strictObject({
  attribution: z.record(z.string(), z.unknown()).optional(),
  delta: z.number(),
  entries: z.array(z.unknown()),
  ga_integer_value: z.number().int(),
  metric_id: z.string().min(1),
  name: webVitalMetricNameSchema,
  navigation_type: z.string().min(1).optional(),
  pathname: z.string().min(1),
  rating: webVitalRatingSchema.optional(),
  value: z.number()
})

export type CanonicalWebVitalCustomData = z.infer<
  typeof canonicalWebVitalCustomDataSchema
>

export const canonicalWebVitalSchema = canonicalEventEnvelopeSchema.extend({
  event_name: z.literal('web_vital'),
  event_id: z.uuid(),
  event_time: z.iso.datetime({ offset: true }),
  source: z.literal('web'),
  page_url: z.url(),
  referrer_url: z.url().optional(),
  page_title: z.string().min(1),
  page_view_id: z.uuid(),
  custom_data: canonicalWebVitalCustomDataSchema
})

export type CanonicalWebVital = z.infer<typeof canonicalWebVitalSchema>

type CreateCanonicalWebVitalInput = {
  browserId?: Record<string, string>
  clickId?: Record<string, string>
  consent: ConsentSnapshot
  customData: CanonicalWebVitalCustomData
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

export type WebVitalDataLayerEvent = {
  attribution?: Record<string, unknown>
  canonical_event: CanonicalWebVital
  custom_data: CanonicalWebVitalCustomData
  delta: number
  event: 'web_vital'
  event_id: string
  event_time: string
  id: string
  name: WebVitalMetricName
  navigationType?: string
  page_view_id?: string
  pathname: string
  rating?: CanonicalWebVitalCustomData['rating']
  source: 'web'
  value: number
}

export function createCanonicalWebVital(
  input: CreateCanonicalWebVitalInput
): CanonicalWebVital {
  const eventDeviceInfo = mapEventDeviceInfo(input.eventDeviceInfo)

  return canonicalWebVitalSchema.parse({
    schema_version: 1,
    event_name: 'web_vital',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'web',
    environment: input.environment,
    ...(input.pageUrl ? { page_url: input.pageUrl } : {}),
    ...(input.pageViewId ? { page_view_id: input.pageViewId } : {}),
    ...(input.referrerUrl ? { referrer_url: input.referrerUrl } : {}),
    ...(input.pageTitle ? { page_title: input.pageTitle } : {}),
    consent: input.consent,
    custom_data: input.customData,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.externalId ? { external_id: input.externalId } : {}),
    ...(input.impressionId ? { impression_id: input.impressionId } : {}),
    ...(eventDeviceInfo ? { event_device_info: eventDeviceInfo } : {})
  })
}

export function buildWebVitalCustomData(input: {
  attribution?: Record<string, unknown>
  delta: number
  entries: unknown[]
  metricId: string
  name: WebVitalMetricName
  navigationType?: string
  pathname: string
  rating?: CanonicalWebVitalCustomData['rating']
  value: number
}): CanonicalWebVitalCustomData {
  return canonicalWebVitalCustomDataSchema.parse({
    ...(input.attribution ? { attribution: input.attribution } : {}),
    delta: input.delta,
    entries: input.entries,
    ga_integer_value: gaWebVitalIntegerValue(input.name, input.value),
    metric_id: input.metricId,
    name: input.name,
    ...(input.navigationType ? { navigation_type: input.navigationType } : {}),
    pathname: input.pathname,
    ...(input.rating ? { rating: input.rating } : {}),
    value: input.value
  })
}

export function buildWebVitalDataLayerEvent(
  event: CanonicalWebVital
): WebVitalDataLayerEvent {
  return {
    event: 'web_vital',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    ...(event.page_view_id ? { page_view_id: event.page_view_id } : {}),
    id: event.custom_data.metric_id,
    name: event.custom_data.name,
    value: event.custom_data.value,
    delta: event.custom_data.delta,
    ...(event.custom_data.rating ? { rating: event.custom_data.rating } : {}),
    ...(event.custom_data.navigation_type ?
      { navigationType: event.custom_data.navigation_type }
    : {}),
    pathname: event.custom_data.pathname,
    ...(event.custom_data.attribution ?
      { attribution: event.custom_data.attribution }
    : {}),
    custom_data: event.custom_data,
    canonical_event: event
  }
}
