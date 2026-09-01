import 'server-only'

import { SpanStatusCode, trace } from '@opentelemetry/api'

type OperationalContextValue = string | number | boolean | null

export function reportOperationalError(input: {
  context?: Readonly<Record<string, OperationalContextValue>>
  error: unknown
  event: string
}): void {
  const exception =
    input.error instanceof Error ?
      input.error
    : new Error('NonError operational failure')
  const span = trace.getActiveSpan()

  span?.recordException(exception)
  span?.setStatus({ code: SpanStatusCode.ERROR })

  console.error(
    JSON.stringify({
      event: input.event,
      level: 'ERROR',
      error: { errorName: exception.name },
      context: input.context ?? {}
    })
  )
}
