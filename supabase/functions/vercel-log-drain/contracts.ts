import { z } from 'zod'

export const MAX_DRAIN_BODY_BYTES = 4 * 1024 * 1024
export const MAX_DRAIN_BATCH_SIZE = 500

const boundedIdentifierSchema = z.string().min(1).max(256)
const statusCodeSchema = z
  .number()
  .int()
  .refine(
    value => value === -1 || (value >= 100 && value <= 599),
    'Expected an HTTP status code or Vercel sentinel -1'
  )

export const vercelLogSourceSchema = z.enum([
  'build',
  'edge',
  'lambda',
  'static',
  'external',
  'firewall',
  'redirect'
])

export const vercelEnvironmentSchema = z.enum([
  'production',
  'preview'
])

const vercelProxySchema = z
  .object({
    timestamp: z.number().int().min(0).max(4_102_444_800_000),
    method: z.string().min(1).max(16),
    host: z.string().min(1).max(253),
    path: z.string().min(1).max(16_384),
    userAgent: z.array(z.string().max(4096)).max(8),
    region: z.string().min(1).max(32),
    referer: z.string().max(4096).optional(),
    statusCode: statusCodeSchema.optional(),
    clientIp: z.string().max(128).optional(),
    responseByteSize: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER)
      .optional(),
    pathType: z
      .enum([
        'func',
        'prerender',
        'background_func',
        'edge',
        'middleware',
        'streaming_func',
        'partial_prerender',
        'external',
        'static',
        'not_found',
        'unknown',
        'api'
      ])
      .optional(),
    pathTypeVariant: z.string().min(1).max(64).optional(),
    vercelId: z.string().min(1).max(256).optional(),
    vercelCache: z
      .enum([
        'MISS',
        'HIT',
        'STALE',
        'BYPASS',
        'PRERENDER',
        'REVALIDATED'
      ])
      .optional(),
    lambdaRegion: z.string().min(1).max(32).optional(),
    wafAction: z
      .enum(['log', 'challenge', 'deny', 'bypass', 'rate_limit'])
      .optional()
  })
  .passthrough()

export const vercelLogEntrySchema = z
  .object({
    'id': boundedIdentifierSchema,
    'deploymentId': boundedIdentifierSchema,
    'source': vercelLogSourceSchema,
    'host': z.string().min(1).max(253),
    'timestamp': z.number().int().min(0).max(4_102_444_800_000),
    'projectId': boundedIdentifierSchema,
    'level': z.enum(['info', 'warning', 'error', 'fatal']),
    'message': z.string().max(262_144).optional(),
    'statusCode': statusCodeSchema.optional(),
    'requestId': boundedIdentifierSchema.optional(),
    'environment': vercelEnvironmentSchema.optional(),
    'executionRegion': z.string().min(1).max(32).optional(),
    'traceId': boundedIdentifierSchema.optional(),
    'trace.id': boundedIdentifierSchema.optional(),
    'proxy': vercelProxySchema.optional()
  })
  .passthrough()

export const vercelLogBatchSchema = z
  .array(z.unknown())
  .min(1)
  .max(MAX_DRAIN_BATCH_SIZE)

const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    'Expected a concrete hostname without a wildcard or port'
  )

export const drainRuntimeConfigSchema = z.object({
  databaseUrl: z
    .string()
    .min(1)
    .refine(
      value =>
        value.startsWith('postgres://') ||
        value.startsWith('postgresql://'),
      'Expected a Postgres connection URL'
    ),
  signatureSecret: z.string().min(32).max(512),
  projectId: boundedIdentifierSchema,
  environment: vercelEnvironmentSchema,
  allowedHosts: z.array(hostnameSchema).min(1).max(20),
  fbclidHmacSecret: z.string().min(32).max(512)
})

export type DrainRuntimeConfig = z.infer<
  typeof drainRuntimeConfigSchema
>
export type VercelLogEntry = z.infer<typeof vercelLogEntrySchema>

export interface VercelEdgeRequestObservation {
  vercel_log_id: string
  edge_request_id: string | null
  deployment_id: string
  project_id: string
  environment: z.infer<typeof vercelEnvironmentSchema>
  observed_at: string
  observation_type: 'document' | 'redirect'
  request_id: string | null
  trace_id: string | null
  vercel_id: string | null
  route_pathname: string
  host: string
  method: 'GET' | 'HEAD'
  source: z.infer<typeof vercelLogSourceSchema>
  status_code: number
  cache_status: string | null
  waf_action: string | null
  path_type: string | null
  path_type_variant: string | null
  edge_region: string
  execution_region: string | null
  lambda_region: string | null
  response_bytes: number | null
  referrer_host: string | null
  in_app_browser: 'facebook' | 'instagram' | 'none' | 'unknown'
  device_class:
    | 'mobile'
    | 'tablet'
    | 'desktop'
    | 'bot'
    | 'unknown'
  os_class:
    | 'ios'
    | 'android'
    | 'macos'
    | 'windows'
    | 'linux'
    | 'other'
    | 'unknown'
  automation_class:
    | 'known_bot_user_agent'
    | 'synthetic_client'
    | 'browser_automation'
    | 'human_or_unknown'
  fbclid_present: boolean
  fbclid_hmac: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  meta_campaign_id: string | null
  meta_adset_id: string | null
  meta_ad_id: string | null
  meta_placement: string | null
  meta_site_source_name: string | null
}
