import {
  isIgnorableClientError
} from '@/lib/observability/client/isIgnorableClientError'
import {
  sanitizeClientErrorFilename,
  sanitizeClientErrorMessage
} from '@/lib/observability/client/sanitizeClientErrorBeacon'
import { describeUnhandledRejection } from '@/lib/observability/client/describeUnhandledRejection'
import { createInjectedBrowserErrorFilter } from '@/lib/observability/client/createInjectedBrowserErrorFilter'
import { sendClientLog } from '@/lib/observability/client/sendClientLog'
import type { LogPayload } from 'types/observability/log/LogPayload'

/**
 * Client instrumentation — executes after the HTML document is loaded but
 * before React hydration begins. Next.js warns when this file takes longer
 * than 16ms, so everything here stays lightweight and is wrapped in
 * try/catch: a single instrumentation failure must never block hydration.
 *
 * Responsibilities:
 *  - Mark a client bootstrap baseline on the Performance timeline.
 *  - Capture uncaught errors and unhandled promise rejections, then beacon
 *    them to the first-party `/api/log` endpoint (production only).
 *  - Expose `onRouterTransitionStart` so client-side App Router navigations
 *    are marked for SPA-transition diagnostics.
 *
 * Optional analytics and replay are initialized elsewhere when enabled.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const isInjectedBeaconNoise = createInjectedBrowserErrorFilter()

const MAX_REPORTED_ERRORS = 10
const reportedSignatures = new Set<string>()

function beaconError(payload: LogPayload) {
  if (reportedSignatures.size >= MAX_REPORTED_ERRORS) return

  const signature = JSON.stringify(payload)
  if (reportedSignatures.has(signature)) return
  reportedSignatures.add(signature)

  if (!IS_PRODUCTION) {
    console.error(`[instrumentation-client] ${payload.event}`)
    return
  }

  try {
    void sendClientLog(payload, {
      fetch,
      sendBeacon: navigator.sendBeacon?.bind(navigator)
    }).catch(() => undefined)
  } catch {
    // Error reporting must never throw.
  }
}

try {
  performance.mark('app-init')

  window.addEventListener('error', event => {
    const stack =
      event.error instanceof Error ?
        event.error.stack
      : undefined
    const message = event.message || 'Unknown client error'
    const errorDetails = {
      message,
      source: event.filename,
      stack
    }
    if (
      isIgnorableClientError(errorDetails) ||
      isInjectedBeaconNoise(errorDetails)
    )
      return

    const sanitizedMessage = sanitizeClientErrorMessage(message)
    const sanitizedFilename =
      event.filename ?
        sanitizeClientErrorFilename(event.filename)
      : undefined

    beaconError({
      event: 'client_error',
      level: 'error',
      data: {
        source: 'window_error',
        ...(sanitizedMessage ?
          { message: sanitizedMessage }
        : {}),
        ...(sanitizedFilename ?
          { filename: sanitizedFilename }
        : {}),
        ...(event.lineno ? { line: event.lineno } : {}),
        ...(event.colno ? { column: event.colno } : {})
      },
      context: { pathname: window.location.pathname }
    })
  })

  window.addEventListener('unhandledrejection', event => {
    const rejection = describeUnhandledRejection(
      event.reason,
      event.promise
    )
    const message =
      event.reason instanceof Error ? event.reason.message
      : typeof event.reason === 'string' ? event.reason
      : 'Unhandled promise rejection'
    const stack =
      event.reason instanceof Error ?
        event.reason.stack
      : undefined

    if (isIgnorableClientError({ message, stack })) {
      return
    }

    const sanitizedMessage = sanitizeClientErrorMessage(message)

    beaconError({
      event: 'client_unhandled_rejection',
      level: 'error',
      data: {
        source: 'unhandled_rejection',
        ...rejection,
        ...(sanitizedMessage ?
          { message: sanitizedMessage }
        : {})
      },
      context: { pathname: window.location.pathname }
    })
  })
} catch {
  // Instrumentation setup is best-effort and must never break the app.
}

/**
 * Invoked by Next.js when a client-side App Router navigation begins.
 * Adds a Performance mark so SPA transition timing is visible in dev tools
 * and Real User Monitoring, without emitting any runtime console noise.
 */
export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  const pathname = new URL(url, window.location.origin).pathname

  try {
    performance.mark(`nav-start:${navigationType}:${pathname}`)
  } catch {
    // Marking is best-effort.
  }
}
