import { sanitizeClientErrorMessage } from './sanitizeClientErrorBeacon'
import { sendClientLog } from './sendClientLog'

export function reportClientCaughtError(
  error: unknown,
  operation: string
): void {
  if (typeof window === 'undefined') return

  const errorName = error instanceof Error ? error.name : 'OtherError'
  const errorMessage =
    error instanceof Error ? error.message : 'Caught client exception'
  const message = sanitizeClientErrorMessage(
    `${operation}: ${errorName}: ${errorMessage}`
  )

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[client-operation] ${operation}`, error)
    return
  }

  void sendClientLog(
    {
      event: 'client_error',
      level: 'error',
      data: {
        source: 'window_error',
        ...(message ? { message } : {})
      },
      context: { pathname: window.location.pathname }
    },
    {
      fetch,
      sendBeacon: navigator.sendBeacon?.bind(navigator)
    }
  ).catch(() => undefined)
}
