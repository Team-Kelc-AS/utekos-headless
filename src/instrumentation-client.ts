import * as Sentry from '@sentry/nextjs'
import { initBotId } from 'botid/client/core'
import {
  CHROME_EXTENSION_URL_PATTERN,
  isIgnorableClientError
} from '@/lib/observability/client/isIgnorableClientError'
import { describeUnhandledRejection } from '@/lib/observability/client/describeUnhandledRejection'
import { filterSentryClientEvent } from '@/lib/observability/client/filterSentryClientEvent'
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

initBotId({
  protect: [
    { method: 'POST', path: '/api/events/*' },
    {
      method: 'POST',
      path: '/api/observability/landing-consent'
    }
  ]
})

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [],
  sendDefaultPii: false,
  enableLogs: true,
  tracesSampleRate: 0,
  denyUrls: [CHROME_EXTENSION_URL_PATTERN],
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
    const body = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/log',
        new Blob([body], { type: 'application/json' })
      )
      return
    }

    void fetch('/api/log', {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' }
    }).catch(() => {})
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
    if (
      isIgnorableClientError({
        message: event.message,
        source: event.filename,
        stack
      })
    )
      return

    beaconError({
      event: 'client_error',
      level: 'error',
      data: {
        source: 'window_error',
        ...(event.lineno ? { line: event.lineno } : {}),
        ...(event.colno ? { column: event.colno } : {})
      },
      context: { pathname: window.location.pathname }
    })
  })

  window.addEventListener('unhandledrejection', event => {
    beaconError({
      event: 'client_unhandled_rejection',
      level: 'error',
      data: {
        source: 'unhandled_rejection',
        ...describeUnhandledRejection(
          event.reason,
          event.promise
        )
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
