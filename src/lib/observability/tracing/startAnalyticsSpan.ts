import {
  SpanStatusCode,
  trace,
  type Span
} from '@opentelemetry/api'

export type AnalyticsSpanOp =
  | 'db.query'
  | 'db.transaction'
  | 'rpc.client'
  | 'cache.get'
  | 'cache.put'
  | 'cache.remove'
  | 'queue.publish'
  | 'queue.receive'
  | 'queue.process'
  | 'queue.ack'
  | 'queue.retry'
  | 'queue.dead_letter'
  | 'workflow'

export type AnalyticsSpanAttributes = Readonly<
  Record<string, string | number | boolean>
>

export type StartAnalyticsSpanOptions = {
  name: string
  op: AnalyticsSpanOp
  attributes?: AnalyticsSpanAttributes
}

/**
 * Starts a low-cardinality analytics span through the global OpenTelemetry
 * provider registered by `@vercel/otel`.
 * Span names must be stable templates — never SQL, IDs, or payloads.
 */
export function startAnalyticsSpan<T>(
  options: StartAnalyticsSpanOptions,
  callback: (span: Span) => T
): T {
  const tracer = trace.getTracer('utekos-headless')

  return tracer.startActiveSpan(
    options.name,
    {
      attributes: {
        'utekos.operation': options.op,
        ...options.attributes
      }
    },
    span => {
      try {
        const result = callback(span)

        if (
          result !== null &&
          typeof result === 'object' &&
          'then' in result &&
          typeof result.then === 'function'
        ) {
          return Promise.resolve(result)
            .catch(error => {
              span.recordException(
                error instanceof Error ? error : String(error)
              )
              span.setStatus({ code: SpanStatusCode.ERROR })
              throw error
            })
            .finally(() => span.end()) as T
        }

        span.end()
        return result
      } catch (error) {
        span.recordException(
          error instanceof Error ? error : String(error)
        )
        span.setStatus({ code: SpanStatusCode.ERROR })
        span.end()
        throw error
      }
    }
  )
}
