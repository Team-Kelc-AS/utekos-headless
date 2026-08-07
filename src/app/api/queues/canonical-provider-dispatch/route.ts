import * as Sentry from '@sentry/nextjs'
import { handleCallback } from '@vercel/queue'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import {
  CANONICAL_PROVIDER_DISPATCH_TOPIC,
  canonicalProviderDispatchMessageSchema,
  type CanonicalProviderDispatchMessage
} from '../../../../lib/analytics/server/canonicalProviderDispatchQueue'
import { runTargetedProviderOutboxAttempt } from '../../../../lib/analytics/server/runTargetedProviderOutboxAttempt'

export const maxDuration = 60

export type CanonicalProviderDispatchQueueDependencies = {
  captureMessage: typeof Sentry.captureMessage
  runAttempt: typeof runTargetedProviderOutboxAttempt
}

const defaultDependencies: CanonicalProviderDispatchQueueDependencies = {
  captureMessage: Sentry.captureMessage,
  runAttempt: runTargetedProviderOutboxAttempt
}

export async function handleCanonicalProviderDispatchQueueMessage(
  message: unknown,
  dependencies: CanonicalProviderDispatchQueueDependencies =
    defaultDependencies
) {
  const parsed = canonicalProviderDispatchMessageSchema.safeParse(
    message
  )

  if (!parsed.success) {
    dependencies.captureMessage(
      'Invalid canonical provider dispatch queue message',
      {
        level: 'error',
        tags: {
          analytics_stage: 'provider_queue_consume',
          queue_message_status: 'invalid'
        }
      }
    )
    return { status: 'invalid_message' as const }
  }

  return dependencies.runAttempt({
    adapterKey: parsed.data.adapter_key,
    attemptId: parsed.data.attempt_id
  })
}

export const POST = handleCallback<CanonicalProviderDispatchMessage>(
  async message => {
    await startAnalyticsSpan(
      {
        name: 'canonical-provider-dispatch',
        op: 'queue.process',
        attributes: {
          'messaging.system': 'vercel_queue',
          'messaging.destination.name':
            CANONICAL_PROVIDER_DISPATCH_TOPIC,
          'messaging.operation.type': 'process',
          'messaging.batch.message_count': 1
        }
      },
      () => handleCanonicalProviderDispatchQueueMessage(message)
    )
  },
  { visibilityTimeoutSeconds: 60 }
)
