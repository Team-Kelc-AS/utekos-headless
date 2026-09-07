import { z } from 'zod'
import {
  canonicalEventEnvelopeSchema,
  type CanonicalEventEnvelope,
  type CanonicalSignalAudit,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import type { CanonicalClickIds } from './canonicalSignalContract'
import { mapEventDeviceInfo } from './mapEventDeviceInfo'
import { stripInternalJourneyContext } from './internalJourneyContext'

export const canonicalGenerateLeadCustomDataSchema =
  z.strictObject({
    submission_id: z.string().min(1),
    form_id: z.string().min(1),
    lead_type: z.string().min(1).optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    value: z.number().nonnegative().optional()
  })

export type CanonicalGenerateLeadCustomData = z.infer<
  typeof canonicalGenerateLeadCustomDataSchema
>

export const canonicalGenerateLeadSchema =
  canonicalEventEnvelopeSchema.extend({
    event_name: z.literal('generate_lead'),
    source: z.literal('server'),
    page_url: z.url(),
    page_view_id: z.uuid().optional(),
    custom_data: canonicalGenerateLeadCustomDataSchema
  })

export type CanonicalGenerateLead = z.infer<
  typeof canonicalGenerateLeadSchema
>

type UserDataInput = {
  emailSha256?: string[]
  phoneSha256?: string[]
}

type CreateCanonicalGenerateLeadInput = {
  browserId?: Record<string, string>
  clickId?: CanonicalClickIds
  clientIpAddress?: string
  consent: ConsentSnapshot
  customData: CanonicalGenerateLeadCustomData
  environment: CanonicalEventEnvelope['environment']
  eventDeviceInfo?: Parameters<typeof mapEventDeviceInfo>[0]
  eventId: string
  eventTime: string
  externalId?: string
  impressionId?: string
  pageUrl: string
  pageViewId?: string
  journeyId?: string
  signalAudit?: CanonicalSignalAudit
  userData?: UserDataInput
}

export type GenerateLeadDataLayerEvent = {
  event: 'generate_lead'
  event_id: string
  event_time: string
  source: 'server'
  page_view_id?: string
  custom_data: CanonicalGenerateLeadCustomData
  canonical_event: CanonicalGenerateLead
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

export function createCanonicalGenerateLead(
  input: CreateCanonicalGenerateLeadInput
): CanonicalGenerateLead {
  const eventDeviceInfo = mapEventDeviceInfo(
    input.eventDeviceInfo
  )
  const userData = mapUserData(input.userData)

  return canonicalGenerateLeadSchema.parse({
    schema_version: 1,
    event_name: 'generate_lead',
    event_id: input.eventId,
    event_time: input.eventTime,
    source: 'server',
    environment: input.environment,
    page_url: input.pageUrl,
    ...((
      input.consent.analytics === 'granted' && input.pageViewId
    ) ?
      { page_view_id: input.pageViewId }
    : {}),
    ...((
      input.consent.analytics === 'granted' && input.journeyId
    ) ?
      { journey_id: input.journeyId }
    : {}),
    consent: input.consent,
    custom_data: input.customData,
    ...(input.browserId ? { browser_id: input.browserId } : {}),
    ...(input.clickId ? { click_id: input.clickId } : {}),
    ...(input.clientIpAddress ?
      { client_ip_address: input.clientIpAddress }
    : {}),
    ...(input.externalId ?
      { external_id: input.externalId }
    : {}),
    ...(input.impressionId ?
      { impression_id: input.impressionId }
    : {}),
    ...(eventDeviceInfo ?
      { event_device_info: eventDeviceInfo }
    : {}),
    ...(input.signalAudit ?
      { signal_audit: input.signalAudit }
    : {}),
    ...(userData ? { user_data: userData } : {})
  })
}

export function buildGenerateLeadDataLayerEvent(
  event: CanonicalGenerateLead
): GenerateLeadDataLayerEvent {
  return {
    event: 'generate_lead',
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    ...(event.page_view_id ?
      { page_view_id: event.page_view_id }
    : {}),
    custom_data: event.custom_data,
    canonical_event: stripInternalJourneyContext(event)
  }
}
