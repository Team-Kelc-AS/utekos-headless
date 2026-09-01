import { handleCallback } from '@vercel/queue'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import {
  CANONICAL_PROVIDER_DISPATCH_TOPIC,
  canonicalProviderDispatchMessageSchema,
  type CanonicalProviderDispatchMessage
} from '../../../../lib/analytics/server/canonicalProviderDispatchQueue'
import { runTargetedProviderOutboxAttempt } from '../../../../lib/analytics/server/runTargetedProviderOutboxAttempt'

export const maxDuration = 60

export type CanonicalProviderDispatchQueueDependencies = {
  reportInvalidMessage: () => void
  runAttempt: typeof runTargetedProviderOutboxAttempt
}

const defaultDependencies: CanonicalProviderDispatchQueueDependencies = {
  reportInvalidMessage: () =>
    reportOperationalError({
      error: new Error('Invalid queue message'),
      event: 'analytics.provider_queue.invalid_message',
      context: {
        analyticsStage: 'provider_queue_consume',
        queueMessageStatus: 'invalid'
      }
    }),
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
    dependencies.reportInvalidMessage()
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
