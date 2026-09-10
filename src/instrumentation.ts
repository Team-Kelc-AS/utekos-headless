import type { Instrumentation } from 'next'
import { sanitizeServerRequestError } from './lib/observability/logging/sanitizeServerRequestError'

const OTEL_SERVICE_NAME = 'utekos-headless'

/**
 * Server instrumentation — called once per Next.js server instance before
 * any request is handled. OpenTelemetry is only registered on the Node.js
 * runtime; the Edge runtime is left untouched since `@vercel/otel` targets
 * Node and edge instrumentation would otherwise be a no-op overhead.
 *
 * `@vercel/otel` owns the single global provider.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerOTel } = await import('@vercel/otel')
    registerOTel(OTEL_SERVICE_NAME)
  }
}

/**
 * Captures every server-side error Next.js surfaces (Server Components,
 * Route Handlers, Server Actions, Proxy) and emits a single structured
 * line to stderr, which Vercel ingests into its log drains. This mirrors
 * the structured-logging approach already used by the web-vitals route and
 * gives end-to-end visibility without coupling to a third-party provider.
 *
 * `digest` is the stable identifier React/Next assigns to the error, so it
 * can be correlated with the opaque digest shown to users in production.
 */
export const onRequestError: Instrumentation.onRequestError =
  async (error, request, context) => {
    console.error('[next][onRequestError]', {
      ...sanitizeServerRequestError(error, request),
      routerKind: context.routerKind,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason
    })
  }
