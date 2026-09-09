import { sanitizeOperationalPathname } from '@/lib/observability/logging/sanitizeOperationalPathname'

export function createCollectorDeliveryError(
  cause: unknown,
  context: {
    attempt: number
    bodyBytes: number
    endpoint: string
    keepalive: boolean
    stage:
      | 'journey_context'
      | 'meta_context'
      | 'event_enrichment'
      | 'serialize'
      | 'request'
    status?: number
  }
): Error {
  const visibility =
    typeof document === 'undefined' ? 'unknown' : (
      document.visibilityState
    )
  const online =
    typeof navigator === 'undefined' ? 'unknown' : (
      navigator.onLine
    )
  const type =
    cause instanceof TypeError ? 'TypeError'
    : cause instanceof Error ? 'Error'
    : 'OtherError'

  return new Error(
    `stage=${context.stage} path=${sanitizeOperationalPathname(context.endpoint)} attempt=${context.attempt} keepalive=${context.keepalive} bytes=${context.bodyBytes} visibility=${visibility} online=${online} status=${context.status ?? 'none'} type=${type}`,
    { cause }
  )
}
