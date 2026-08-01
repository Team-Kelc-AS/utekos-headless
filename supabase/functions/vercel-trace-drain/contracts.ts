import { z } from 'zod'

export const MAX_TRACE_DRAIN_BODY_BYTES = 4 * 1024 * 1024
export const MAX_TRACE_SPANS = 1000

const boundedIdentifierSchema = z.string().min(1).max(256)
const traceIdSchema = z.string().regex(/^[0-9a-fA-F]{32}$/)
const spanIdSchema = z.string().regex(/^[0-9a-fA-F]{16}$/)
const unixNanosecondsSchema = z.string().regex(/^\d{1,20}$/)

const otlpAttributeSchema = z
  .object({
    key: z.string().min(1).max(256),
    value: z
      .object({ stringValue: z.string().max(1024).optional() })
      .passthrough()
  })
  .passthrough()

const otlpSpanSchema = z
  .object({
    traceId: traceIdSchema,
    spanId: spanIdSchema,
    name: z.string().max(1024),
    kind: z.union([
      z.number().int().min(0).max(5),
      z.enum([
        'unspecified',
        'internal',
        'server',
        'client',
        'producer',
        'consumer'
      ])
    ]),
    startTimeUnixNano: unixNanosecondsSchema,
    endTimeUnixNano: unixNanosecondsSchema
  })
  .passthrough()

const otlpScopeSpansSchema = z
  .object({
    spans: z.array(otlpSpanSchema).max(MAX_TRACE_SPANS)
  })
  .passthrough()

const otlpResourceSpansSchema = z
  .object({
    resource: z
      .object({
        attributes: z.array(otlpAttributeSchema).max(128)
      })
      .passthrough(),
    scopeSpans: z.array(otlpScopeSpansSchema).max(100)
  })
  .passthrough()

export const vercelTraceEnvelopeSchema = z
  .object({
    resourceSpans: z
      .array(otlpResourceSpansSchema)
      .min(1)
      .max(100)
  })
  .passthrough()
  .superRefine((envelope, context) => {
    let spanCount = 0
    for (const resourceSpans of envelope.resourceSpans) {
      for (const scopeSpans of resourceSpans.scopeSpans) {
        spanCount += scopeSpans.spans.length
      }
    }

    if (spanCount === 0 || spanCount > MAX_TRACE_SPANS) {
      context.addIssue({
        code: 'custom',
        message: `Expected between 1 and ${MAX_TRACE_SPANS} spans`
      })
    }
  })

export const traceDrainRuntimeConfigSchema = z.object({
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
  environment: z.literal('production')
})

export type TraceDrainRuntimeConfig = z.infer<
  typeof traceDrainRuntimeConfigSchema
>
export type VercelTraceEnvelope = z.infer<
  typeof vercelTraceEnvelopeSchema
>

export interface VercelTraceObservation {
  trace_id: string
  deployment_id: string
  project_id: string
  environment: 'production'
  observed_at: string
  start_time_unix_nano: string
  end_time_unix_nano: string
  duration_ms: string
  span_count: number
}
