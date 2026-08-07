import 'server-only'
import * as Sentry from '@sentry/nextjs'
import {
  DuplicateMessageError,
  send
} from '@vercel/queue'
import { z } from 'zod'
import { startAnalyticsSpan } from '@/lib/observability/tracing/startAnalyticsSpan'
import type { CreatedProviderDispatchAttempt } from './canonicalEventStore'
import {
  providerAdapterRegistry,
  type RegisteredProviderAdapterKey
} from './providerAdapterRegistry'

export const CANONICAL_PROVIDER_DISPATCH_TOPIC =
  'canonical-provider-dispatch-v1'
export const CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS =
  60 * 60 * 24 * 7

export const canonicalProviderDispatchMessageSchema = z
  .object({
    adapter_key: z
      .string()
      .min(1)
      .refine(
        key => key in providerAdapterRegistry,
        'unregistered_provider_adapter_key'
      ),
    attempt_id: z.string().uuid(),
    schema_version: z.literal(1)
  })
  .strict()
  .transform(message => {
    return {
      ...message,
      adapter_key:
        message.adapter_key as RegisteredProviderAdapterKey
    }
  })

export type CanonicalProviderDispatchMessage = z.infer<
  typeof canonicalProviderDispatchMessageSchema
>

type QueueSend = (
  topic: string,
  payload: CanonicalProviderDispatchMessage,
  options: {
    idempotencyKey: string
    retentionSeconds: number
  }
) => Promise<{ messageId: string | null }>

export type CanonicalProviderDispatchPublisherDependencies = {
  captureException: typeof Sentry.captureException
  isQueueRuntime: () => boolean
  send: QueueSend
}

const defaultDependencies: CanonicalProviderDispatchPublisherDependencies = {
  captureException: Sentry.captureException,
  isQueueRuntime: () => process.env.VERCEL === '1',
  send
}

function captureQueuePublishFailure(
  error: unknown,
  attempt: CreatedProviderDispatchAttempt,
  dependencies: CanonicalProviderDispatchPublisherDependencies
) {
  dependencies.captureException(error, {
    extra: {
      adapter_key: attempt.adapterKey,
      attempt_id: attempt.attemptId
    },
    tags: {
      analytics_stage: 'provider_queue_publish',
      queue_topic: CANONICAL_PROVIDER_DISPATCH_TOPIC
    }
  })
}

export async function publishCanonicalProviderDispatchAttempts(
  attempts: CreatedProviderDispatchAttempt[],
  dependencies: CanonicalProviderDispatchPublisherDependencies =
    defaultDependencies
) {
  if (attempts.length === 0 || !dependencies.isQueueRuntime()) {
    return
  }

  await startAnalyticsSpan(
    {
      name: 'canonical-provider-dispatch',
      op: 'queue.publish',
      attributes: {
        'messaging.system': 'vercel_queue',
        'messaging.destination.name':
          CANONICAL_PROVIDER_DISPATCH_TOPIC,
        'messaging.operation.type': 'send',
        'messaging.batch.message_count': attempts.length
      }
    },
    () =>
      Promise.all(
        attempts.map(async attempt => {
          const payload = canonicalProviderDispatchMessageSchema.parse({
            adapter_key: attempt.adapterKey,
            attempt_id: attempt.attemptId,
            schema_version: 1
          })

          try {
            await dependencies.send(
              CANONICAL_PROVIDER_DISPATCH_TOPIC,
              payload,
              {
                idempotencyKey: `${attempt.adapterKey}:${attempt.attemptId}`,
                retentionSeconds:
                  CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS
              }
            )
          } catch (error) {
            if (error instanceof DuplicateMessageError) return
            captureQueuePublishFailure(error, attempt, dependencies)
          }
        })
      )
  )
}
