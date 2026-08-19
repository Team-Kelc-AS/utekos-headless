import { z } from 'zod'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'
import { compactDefined } from './compactDefined'
import type { AppLogEntryExtras } from 'types/observability/log/AppLogEntry'

const BLOCKED_PARAMETER_KEYS = new Set([
  'authorizationtoken',
  'cart_id',
  'cartid',
  'checkout_id',
  'click_id',
  'clickid',
  'client_ip',
  'client_ip_address',
  'client_user_agent',
  'email',
  'em',
  'external_id',
  'externalid',
  'fbc',
  'fbp',
  'gbraid',
  'gclid',
  'msclkid',
  'order_id',
  'orderid',
  'password',
  'ph',
  'phone',
  'token',
  'user_agent',
  'user_data',
  'useragent',
  'userdata',
  'wbraid'
])

const emailLike = /\S+@\S+\.\S+/

function isBlockedParameterKey(key: string) {
  return BLOCKED_PARAMETER_KEYS.has(key.toLowerCase())
}

function sanitizeLogString(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return sanitizeOperationalPathname(value)
  }

  if (emailLike.test(value)) {
    return '[redacted]'
  }

  return value
}

function addBlockedKeyIssue(
  ctx: z.RefinementCtx,
  key: string,
  path: Array<string | number>
) {
  ctx.addIssue({
    code: 'custom',
    message: `Blocked log parameter: ${key}`,
    path
  })
}

function rejectBlockedKeys(
  value: unknown,
  ctx: z.RefinementCtx,
  path: Array<string | number> = []
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      rejectBlockedKeys(item, ctx, [...path, index])
    })
    return
  }

  if (!value || typeof value !== 'object') return

  for (const [key, entry] of Object.entries(value)) {
    const nextPath = [...path, key]
    if (isBlockedParameterKey(key)) {
      addBlockedKeyIssue(ctx, key, nextPath)
      continue
    }

    rejectBlockedKeys(entry, ctx, nextPath)
  }
}

const sanitizedStringSchema = z
  .string()
  .min(1)
  .max(2_048)
  .transform(sanitizeLogString)

const appLogScalarSchema = z.union([
  sanitizedStringSchema,
  z.number().finite(),
  z.boolean(),
  z.null()
])

const appLogParameterObjectSchema = z.record(
  z.string().min(1).max(64),
  appLogScalarSchema
)

const appLogParameterValueSchema = z.union([
  appLogScalarSchema,
  z.array(z.union([appLogScalarSchema, appLogParameterObjectSchema])).max(250),
  appLogParameterObjectSchema
])

const appLogParametersSchema = z
  .record(z.string().min(1).max(64), appLogParameterValueSchema)
  .superRefine((value, ctx) => {
    rejectBlockedKeys(value, ctx)
  })

const appLogAdPlatformEventSchema = z.strictObject({
  eventName: z.string().min(1).max(120),
  requiredParameters: z.array(z.string().min(1).max(64)).max(64),
  transport: z.strictObject({
    browser: z.string().min(1).max(64).nullable(),
    server: z.string().min(1).max(64).nullable()
  }),
  parameters: appLogParametersSchema
})

const webVitalEntriesSchema = z
  .array(
    z.union([
      appLogScalarSchema,
      appLogParameterObjectSchema
    ])
  )
  .max(32)

export const appLogEntryExtrasSchema = z.strictObject({
  adPlatformEvents: z
    .strictObject({
      google: appLogAdPlatformEventSchema.optional(),
      meta: appLogAdPlatformEventSchema.optional(),
      microsoft_uet: appLogAdPlatformEventSchema.optional(),
      pinterest: appLogAdPlatformEventSchema.optional()
    })
    .optional(),
  consent: z
    .strictObject({
      analytics: z.enum(['denied', 'granted']),
      marketing: z.enum(['denied', 'granted']),
      preferences: z.enum(['denied', 'granted']),
      source: z.literal('cookiebot'),
      version: z.string().min(1).max(64)
    })
    .optional(),
  environment: z
    .enum(['development', 'preview', 'production', 'test'])
    .optional(),
  eventDeviceInfo: z
    .strictObject({
      language: z.string().min(1).max(32).optional(),
      pixelRatio: z.number().positive().max(32).optional(),
      platform: z.string().min(1).max(64).optional(),
      screenHeight: z.number().int().positive().max(100_000).optional(),
      screenWidth: z.number().int().positive().max(100_000).optional(),
      viewportHeight: z.number().int().positive().max(100_000).optional(),
      viewportWidth: z.number().int().positive().max(100_000).optional()
    })
    .optional(),
  eventId: z.string().uuid().optional(),
  eventName: z.string().min(1).max(120).optional(),
  eventTime: z.string().min(1).max(64).optional(),
  pageTitle: z
    .string()
    .min(1)
    .max(200)
    .transform(sanitizeLogString)
    .optional(),
  pageUrl: z
    .string()
    .min(1)
    .max(2_048)
    .transform(sanitizeOperationalPathname)
    .optional(),
  pageViewId: z.string().uuid().optional(),
  referrerUrl: z
    .string()
    .min(1)
    .max(2_048)
    .transform(sanitizeOperationalPathname)
    .optional(),
  webVitalMetricDelta: z.number().finite().optional(),
  webVitalMetricEntries: webVitalEntriesSchema.optional(),
  webVitalMetricId: z.string().min(1).max(120).optional(),
  webVitalMetricName: z.string().min(1).max(32).optional(),
  webVitalMetricNavigationType: z.string().min(1).max(32).optional(),
  webVitalMetricRating: z.string().min(1).max(32).optional(),
  webVitalMetricValue: z.number().finite().optional()
})

export function parseAppLogEntryExtras(
  input: unknown
): AppLogEntryExtras {
  return compactDefined(
    appLogEntryExtrasSchema.parse(input)
  ) as AppLogEntryExtras
}
