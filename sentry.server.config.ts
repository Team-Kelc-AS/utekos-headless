import * as Sentry from '@sentry/nextjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'

const dsn =
  process.env.NEXT_PUBLIC_PERFORMANCE_SENTRY_DSN
  ?? process.env.NEXT_PUBLIC_SENTRY_DSN

const isProduction = process.env.NODE_ENV === 'production'
const runtime = getVercelRuntimeContext()

/**
 * Node Sentry client. OpenTelemetry provider ownership stays with
 * `@vercel/otel` (`skipOpenTelemetrySetup`); instrumentation wires the
 * Sentry sampler/processor/propagator/context manager into that pipeline.
 */
export const sentryNodeClient = Sentry.init({
  dsn,
  enabled: !!dsn,
  skipOpenTelemetrySetup: true,

  environment: runtime.environment,
  release: runtime.commitSha ?? undefined,

  initialScope: {
    tags: {
      vercel_region: runtime.region ?? 'unknown',
      vercel_deployment_id: runtime.deploymentId ?? 'local'
    }
  },

  integrations: [
    nodeProfilingIntegration(),
    Sentry.nodeRuntimeMetricsIntegration()
  ],

  tracesSampleRate: isProduction ? 0.1 : 1,

  profileSessionSampleRate: isProduction ? 0.05 : 1,
  profileLifecycle: 'trace'
})
