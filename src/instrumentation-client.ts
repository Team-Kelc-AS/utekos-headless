import * as Sentry from '@sentry/nextjs'
import {
  BOTID_KASADA_PATH_PATTERN,
  BOTID_KASADA_URL_PATTERN,
  CHROME_EXTENSION_URL_PATTERN,
  COOKIEBOT_URL_PATTERN,
  isIgnorableClientError
} from '@/lib/observability/client/isIgnorableClientError'
import {
  sanitizeClientErrorFilename,
  sanitizeClientErrorMessage
} from '@/lib/observability/client/sanitizeClientErrorBeacon'
import { describeUnhandledRejection } from '@/lib/observability/client/describeUnhandledRejection'
import { filterSentryClientEvent } from '@/lib/observability/client/filterSentryClientEvent'
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
const SENTRY_DSN =
  process.env.NEXT_PUBLIC_PERFORMANCE_SENTRY_DSN ??
  process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [],
  sendDefaultPii: false,
  enableLogs: true,
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1,
  ignoreErrors: [
    'Unsupported Summarizer API',
    'The requested language options are not supported',
    'Blocked aria-hidden on an element because its descendant retained focus',
    'CybotCookiebotDialog'
  ],
  denyUrls: [
    CHROME_EXTENSION_URL_PATTERN,
    BOTID_KASADA_PATH_PATTERN,
    BOTID_KASADA_URL_PATTERN,
    COOKIEBOT_URL_PATTERN
  ],
  beforeSend: filterSentryClientEvent
})

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
    })
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
    if (
      isIgnorableClientError({
        message,
        source: event.filename,
        stack
      })
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
        ...(sanitizedMessage ? { message: sanitizedMessage } : {}),
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
      event.reason instanceof Error ?
        event.reason.message
      : typeof event.reason === 'string' ?
        event.reason
      : 'Unhandled promise rejection'
    const stack =
      event.reason instanceof Error ?
        event.reason.stack
      : undefined

    if (isIgnorableClientError({ message, stack })) {
      return
    }

    try {
      if (event.reason instanceof Error) {
        Sentry.withScope(scope => {
          scope.setTag(
            'client_error_source',
            'unhandled_rejection'
          )
          scope.setTag('client_route', window.location.pathname)
          Sentry.captureException(event.reason)
        })
      }
    } catch {
      // Error reporting must never throw.
    }

    beaconError({
      event: 'client_unhandled_rejection',
      level: 'error',
      data: {
        source: 'unhandled_rejection',
        ...rejection
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
  Sentry.captureRouterTransitionStart(pathname, navigationType)

  try {
    performance.mark(`nav-start:${navigationType}:${pathname}`)
  } catch {
    // Marking is best-effort.
  }
}
