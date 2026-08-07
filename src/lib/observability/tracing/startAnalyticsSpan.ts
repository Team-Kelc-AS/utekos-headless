import * as Sentry from '@sentry/nextjs'

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

export type AnalyticsSpanAttributes = Readonly<
  Record<string, string | number | boolean>
>

export type StartAnalyticsSpanOptions = {
  name: string
  op: AnalyticsSpanOp
  attributes?: AnalyticsSpanAttributes
}

/**
 * Starts a low-cardinality analytics span via Sentry's active-span API.
 * Span names must be stable templates — never SQL, IDs, or payloads.
 */
export function startAnalyticsSpan<T>(
  options: StartAnalyticsSpanOptions,
  callback: (span: Sentry.Span) => T
): T {
  return Sentry.startSpan(
    {
      name: options.name,
      op: options.op,
      ...(options.attributes ?
        { attributes: options.attributes }
      : {})
    },
    callback
  )
}
