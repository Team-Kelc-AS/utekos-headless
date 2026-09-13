import { z } from 'zod'
import { operationalRoute } from '../_shared/operational-route.ts'
import {
  vercelLogEntrySchema,
  type DrainRuntimeConfig
} from './contracts.ts'

const envelopeSchema = vercelLogEntrySchema
  .omit({ proxy: true })
  .extend({
    path: z.string().max(16_384).optional(),
    proxy: z
      .object({
        host: z.string().max(253).optional(),
        path: z.string().max(16_384).optional(),
        method: z.string().max(16).optional(),
        statusCode: vercelLogEntrySchema.shape.statusCode
      })
      .optional()
  })
const eventSchema = z.enum([
  'client.error',
  'client.unhandled_rejection',
  'meta_dataset_quality.incomplete',
  'contact.send_failed',
  'contact.exception',
  'contact.atlas_failed',
  'contact.atlas_exception',
  'waitlist.send_failed',
  'newsletter.shopify_sync_failed',
  'newsletter.welcome_email_failed',
  'newsletter.exception',
  'lead.persist_failed',
  'lead.record_failed',
  'commerce.klarna_checkout',
  'commerce.purchase_notification_failed'
])
const errorSchema = z.enum([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'AggregateError',
  'AbortError',
  'TimeoutError',
  'ZodError',
  'DOMException',
  'OtherError',
  'ClientError'
])
const messageSchema = z.object({
  event: eventSchema.optional().catch(undefined),
  data: z
    .object({
      errorName: errorSchema.optional().catch(undefined),
      message: z
        .string()
        .max(262_144)
        .optional()
        .catch(undefined),
      reasonCode: z
        .enum([
          'configuration',
          'network',
          'provider_rejected',
          'unknown'
        ])
        .optional()
        .catch(undefined)
    })
    .optional()
    .catch(undefined),
  context: z
    .object({
      route: z.string().max(2048).optional().catch(undefined)
    })
    .optional()
    .catch(undefined)
})

function route(value: string | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return null
  try {
    return operationalRoute(
      new URL(value, 'https://drain.invalid').pathname
    )
  } catch {
    return null
  }
}

function identifier(value: string | undefined): string | null {
  return value && /^[a-zA-Z0-9_:-]{1,256}$/.test(value) ?
      value
    : null
}

export function sanitizeDiagnostic(
  value: unknown,
  config: DrainRuntimeConfig
) {
  const parsed = envelopeSchema.safeParse(value)
  if (!parsed.success)
    return { reason: 'invalid_schema' } as const
  const entry = parsed.data
  if (
    entry.projectId !== config.projectId ||
    entry.environment !== config.environment
  )
    return { reason: 'outside_scope' } as const
  if (entry.source === 'build')
    return { reason: 'build_excluded' } as const
  const status =
    entry.proxy?.statusCode ?? entry.statusCode ?? null
  if (
    entry.level === 'info' &&
    (status === null || status < 400)
  )
    return { reason: 'not_diagnostic' } as const
  let structured: z.infer<typeof messageSchema> | undefined
  try {
    const result = messageSchema.safeParse(
      JSON.parse(entry.message ?? '')
    )
    if (result.success) structured = result.data
  } catch {
    /* Unstructured text is classified below; never persisted. */
  }
  const message =
    structured?.data?.message ?? entry.message ?? ''
  const exactName = errorSchema.safeParse(
    message.split(':', 1)[0]?.trim()
  )
  const name =
    structured?.data?.errorName ??
    (exactName.success ? exactName.data : null)
  const category =
    /timeout|timed out/i.test(message) ? 'timeout'
    : (
      /ECONNRESET|ECONNREFUSED|ENOTFOUND|fetch failed/i.test(
        message
      )
    ) ?
      'network'
    : /Failed to find Server Action/i.test(message) ?
      'server_action_missing'
    : /Minified React error #418|hydration/i.test(message) ?
      'hydration'
    : (name ??
      structured?.data?.reasonCode ??
      (status !== null && status >= 400 ?
        'http_error'
      : 'unclassified'))
  const trace = entry.traceId ?? entry['trace.id']
  return {
    observation: {
      vercel_log_id: entry.id,
      project_id: config.projectId,
      deployment_id: entry.deploymentId,
      environment: config.environment,
      observed_at: new Date(entry.timestamp).toISOString(),
      level: entry.level,
      source: entry.source,
      request_route: route(entry.proxy?.path ?? entry.path),
      context_route: route(structured?.context?.route),
      method:
        (
          [
            'GET',
            'HEAD',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
          ].includes(entry.proxy?.method ?? '')
        ) ?
          entry.proxy!.method!
        : null,
      status_code: status,
      request_id: identifier(entry.requestId),
      trace_id:
        trace && /^[a-fA-F0-9]{32}$/.test(trace) ?
          trace.toLowerCase()
        : null,
      event_name: structured?.event ?? null,
      error_name: name,
      category,
      message_policy:
        entry.message ? 'classified_raw_omitted' : 'not_provided'
    }
  } as const
}

export type DiagnosticObservation = Extract<
  ReturnType<typeof sanitizeDiagnostic>,
  { observation: unknown }
>['observation']

export function sanitizeDiagnosticBatch(
  values: unknown[],
  config: DrainRuntimeConfig
) {
  const observations = new Map<string, DiagnosticObservation>()
  const reasons = {
    invalid_schema: 0,
    outside_scope: 0,
    build_excluded: 0,
    not_diagnostic: 0
  }
  let duplicates = 0
  for (const value of values) {
    const result = sanitizeDiagnostic(value, config)
    if (result.reason !== undefined) reasons[result.reason]++
    else {
      if (observations.has(result.observation.vercel_log_id))
        duplicates++
      observations.set(
        result.observation.vercel_log_id,
        result.observation
      )
    }
  }
  return {
    observations: [...observations.values()],
    reasons,
    duplicates
  }
}
