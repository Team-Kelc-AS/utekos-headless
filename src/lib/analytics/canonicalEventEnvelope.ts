import { z } from 'zod'
import {
  canonicalClickIdsSchema,
  canonicalSignalAuditSchema
} from './canonicalSignalContract'
import { canonicalExperimentAssignmentSchema } from './experimentAssignment'

const consentValueSchema = z.enum(['denied', 'granted'])

const consentSnapshotSchema = z.strictObject({
  analytics: consentValueSchema,
  marketing: consentValueSchema,
  preferences: consentValueSchema,
  source: z.literal('cookiebot'),
  version: z.string().min(1)
})

const eventDeviceInfoSchema = z.strictObject({
  language: z.string().min(1).optional(),
  pixel_ratio: z.number().positive().optional(),
  platform: z.string().min(1).optional(),
  screen_height: z.number().int().positive().optional(),
  screen_width: z.number().int().positive().optional(),
  user_agent: z.string().min(1).optional(),
  viewport_height: z.number().int().positive().optional(),
  viewport_width: z.number().int().positive().optional()
})

const identifierMapSchema = z.record(
  z.string().min(1),
  z.string().min(1)
)

export const canonicalUserDataSchema = z.strictObject({
  email_sha256: z
    .array(z.string().regex(/^[a-f0-9]{64}$/))
    .optional(),
  facebook_login_id: z
    .string()
    .regex(/^\d+$/u)
    .max(64)
    .optional(),
  phone_sha256: z
    .array(z.string().regex(/^[a-f0-9]{64}$/))
    .optional()
})

const locationSchema = z.strictObject({
  city: z.string().min(1).optional(),
  country_code: z.string().length(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  postal_code: z.string().min(1).optional(),
  region_code: z.string().min(1).optional(),
  source: z
    .enum([
      'browser_permission',
      'customer_provided',
      'ip_geolocation',
      'server_request'
    ])
    .optional()
})

export const canonicalEventEnvelopeSchema = z.strictObject({
  schema_version: z.literal(1),
  event_name: z.string().min(1),
  event_id: z.string().uuid(),
  event_time: z.string().datetime({ offset: true }),
  source: z.enum(['web', 'server', 'webhook']),
  environment: z.enum([
    'development',
    'preview',
    'production',
    'test'
  ]),
  consent: consentSnapshotSchema,
  experiment: canonicalExperimentAssignmentSchema.optional(),
  user_data: canonicalUserDataSchema.optional(),
  click_id: canonicalClickIdsSchema.optional(),
  external_id: z.string().min(1).optional(),
  browser_id: identifierMapSchema.optional(),
  client_ip_address: z.string().min(1).optional(),
  event_device_info: eventDeviceInfoSchema.optional(),
  region_code: z.string().min(1).optional(),
  impression_id: z.string().min(1).optional(),
  journey_id: z.string().uuid().optional(),
  page_url: z.string().url().optional(),
  previous_page_view_id: z.string().uuid().optional(),
  location: locationSchema.optional(),
  signal_audit: canonicalSignalAuditSchema.optional()
})

export type CanonicalEventEnvelope = z.infer<
  typeof canonicalEventEnvelopeSchema
>

export type ConsentSnapshot = CanonicalEventEnvelope['consent']
export type {
  CanonicalSignalAudit,
  CanonicalSignalAuditEntry
} from './canonicalSignalContract'
