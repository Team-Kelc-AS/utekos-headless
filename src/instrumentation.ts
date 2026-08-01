import type { Instrumentation } from 'next'

/**
 * Server instrumentation — called once per Next.js server instance before
 * any request is handled. OpenTelemetry is only registered on the Node.js
 * runtime; the Edge runtime is left untouched since `@vercel/otel` targets
 * Node and edge instrumentation would otherwise be a no-op overhead.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
    const { registerOTel } = await import('@vercel/otel')
    registerOTel({ serviceName: 'utekos-headless' })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
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
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  try {
    const { captureRequestError } = await import('@sentry/nextjs')
    captureRequestError(error, request, context)
  } catch (captureError) {
    console.error('[next][onRequestError][sentry]', captureError)
  }

  const err =
    error instanceof Error ?
      (error as Error & { digest?: string })
    : { name: 'NonError', message: String(error), digest: undefined, stack: undefined }

  console.error('[next][onRequestError]', {
    name: err.name,
    message: err.message,
    digest: err.digest,
    stack: err.stack,
    path: request.path,
    method: request.method,
    edgeRequestId:
      request.headers['x-utekos-edge-request-id'] ??
      undefined,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason
  })
}
