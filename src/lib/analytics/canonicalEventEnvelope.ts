import * as z from '@/lib/validation/zodMini'
import { metaAudienceSchema } from './metaAudience'
import {
  canonicalClickIdsSchema,
  canonicalSignalAuditSchema
} from './canonicalSignalContract'
import { canonicalExperimentAssignmentSchema } from './experimentAssignment'

const consentValueSchema = z.enum(['denied', 'granted'])

export const consentSnapshotSchema = z.strictObject({
  analytics: consentValueSchema,
  marketing: consentValueSchema,
  preferences: consentValueSchema,
  source: z.enum(['cookiebot', 'operator_policy']),
  version: z.string().check(z.minLength(1))
})

const eventDeviceInfoSchema = z.strictObject({
  language: z.optional(z.string().check(z.minLength(1))),
  pixel_ratio: z.optional(z.number().check(z.gt(0))),
  platform: z.optional(z.string().check(z.minLength(1))),
  screen_height: z.optional(z.number().check(z.int(), z.gt(0))),
  screen_width: z.optional(z.number().check(z.int(), z.gt(0))),
  user_agent: z.optional(z.string().check(z.minLength(1))),
  viewport_height: z.optional(
    z.number().check(z.int(), z.gt(0))
  ),
  viewport_width: z.optional(z.number().check(z.int(), z.gt(0)))
})

const identifierMapSchema = z.record(
  z.string().check(z.minLength(1)),
  z.string().check(z.minLength(1))
)

export const canonicalUserDataSchema = z.strictObject({
  city_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  country_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  email_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  facebook_login_id: z.optional(
    z.string().check(z.regex(/^\d+$/u), z.maxLength(64))
  ),
  first_name_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  last_name_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  phone_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  postal_code_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  ),
  state_sha256: z.optional(
    z.array(z.string().check(z.regex(/^[a-f0-9]{64}$/)))
  )
})

const locationSchema = z.strictObject({
  city: z.optional(z.string().check(z.minLength(1))),
  country_code: z.optional(z.string().check(z.length(2))),
  latitude: z.optional(z.number().check(z.gte(-90), z.lte(90))),
  longitude: z.optional(
    z.number().check(z.gte(-180), z.lte(180))
  ),
  postal_code: z.optional(z.string().check(z.minLength(1))),
  region_code: z.optional(z.string().check(z.minLength(1))),
  source: z.optional(
    z.enum([
      'browser_permission',
      'customer_provided',
      'ip_geolocation',
      'server_request'
    ])
  )
})

export const canonicalEventEnvelopeSchema = z.strictObject({
  schema_version: z.literal(1),
  event_name: z.string().check(z.minLength(1)),
  event_id: z.string().check(z.uuid()),
  event_time: z.string().check(z.iso.datetime({ offset: true })),
  source: z.enum(['web', 'server', 'webhook']),
  environment: z.enum([
    'development',
    'preview',
    'production',
    'test'
  ]),
  consent: consentSnapshotSchema,
  meta_audience: z.optional(metaAudienceSchema),
  experiment: z.optional(canonicalExperimentAssignmentSchema),
  user_data: z.optional(canonicalUserDataSchema),
  click_id: z.optional(canonicalClickIdsSchema),
  external_id: z.optional(z.string().check(z.minLength(1))),
  browser_id: z.optional(identifierMapSchema),
  client_ip_address: z.optional(
    z.string().check(z.minLength(1))
  ),
  event_device_info: z.optional(eventDeviceInfoSchema),
  region_code: z.optional(z.string().check(z.minLength(1))),
  impression_id: z.optional(z.string().check(z.minLength(1))),
  journey_id: z.optional(z.string().check(z.uuid())),
  page_url: z.optional(z.string().check(z.url())),
  previous_page_view_id: z.optional(z.string().check(z.uuid())),
  location: z.optional(locationSchema),
  signal_audit: z.optional(canonicalSignalAuditSchema)
})

export type CanonicalEventEnvelope = z.infer<
  typeof canonicalEventEnvelopeSchema
>

export type ConsentSnapshot = CanonicalEventEnvelope['consent']
export type {
  CanonicalSignalAudit,
  CanonicalSignalAuditEntry
} from './canonicalSignalContract'
