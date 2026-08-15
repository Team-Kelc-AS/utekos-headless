import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { CanonicalProviderDispatchPublisherDependencies } from './canonicalProviderDispatchQueue'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { DuplicateMessageError } =
  require('@vercel/queue') as typeof import('@vercel/queue')
const {
  CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS,
  CANONICAL_PROVIDER_DISPATCH_TOPIC,
  canonicalProviderDispatchMessageSchema,
  publishCanonicalProviderDispatchAttempts
} =
  require('./canonicalProviderDispatchQueue.ts') as typeof import('./canonicalProviderDispatchQueue')

const attempt = {
  adapterKey: 'meta:view_cart' as const,
  attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
}

function dependencies(
  overrides: Partial<CanonicalProviderDispatchPublisherDependencies> = {}
) {
  const captured: unknown[] = []
  const sends: unknown[] = []
  const value: CanonicalProviderDispatchPublisherDependencies = {
    captureException: error => {
      captured.push(error)
      return 'event-id'
    },
    isQueueRuntime: () => true,
    send: async (topic, payload, options) => {
      sends.push({ options, payload, topic })
      return { messageId: 'message-1' }
    },
    ...overrides
  }

  return { captured, sends, value }
}

test('publishes only the PII-free targeted attempt envelope', async () => {
  const fake = dependencies()

  await publishCanonicalProviderDispatchAttempts(
    [attempt],
    fake.value
  )

  assert.deepEqual(fake.sends, [
    {
      topic: CANONICAL_PROVIDER_DISPATCH_TOPIC,
      payload: {
        adapter_key: 'meta:view_cart',
        attempt_id: attempt.attemptId,
        schema_version: 1
      },
      options: {
        idempotencyKey: `meta:view_cart:${attempt.attemptId}`,
        retentionSeconds:
          CANONICAL_PROVIDER_DISPATCH_RETENTION_SECONDS
      }
    }
  ])
  assert.equal(
    JSON.stringify(fake.sends).includes('custom_data'),
    false
  )
})

test('does nothing outside the Vercel Queue runtime', async () => {
  const fake = dependencies({ isQueueRuntime: () => false })

  await publishCanonicalProviderDispatchAttempts(
    [attempt],
    fake.value
  )

  assert.deepEqual(fake.sends, [])
  assert.deepEqual(fake.captured, [])
})

test('treats a duplicate idempotency key as already published', async () => {
  const fake = dependencies({
    send: async () => {
      throw new DuplicateMessageError(
        'duplicate',
        `meta:view_cart:${attempt.attemptId}`
      )
    }
  })

  await publishCanonicalProviderDispatchAttempts(
    [attempt],
    fake.value
  )

  assert.deepEqual(fake.captured, [])
})

test('captures but does not rethrow a post-commit publish failure', async () => {
  const failure = new Error('queue unavailable')
  const fake = dependencies({
    send: async () => {
      throw failure
    }
  })

  await publishCanonicalProviderDispatchAttempts(
    [attempt],
    fake.value
  )

  assert.deepEqual(fake.captured, [failure])
})

test('rejects unknown adapters, extra fields, and non-UUID attempts', () => {
  assert.equal(
    canonicalProviderDispatchMessageSchema.safeParse({
      adapter_key: 'meta:not_registered',
      attempt_id: attempt.attemptId,
      schema_version: 1
    }).success,
    false
  )
  assert.equal(
    canonicalProviderDispatchMessageSchema.safeParse({
      adapter_key: attempt.adapterKey,
      attempt_id: 'not-a-uuid',
      schema_version: 1
    }).success,
    false
  )
  assert.equal(
    canonicalProviderDispatchMessageSchema.safeParse({
      adapter_key: attempt.adapterKey,
      attempt_id: attempt.attemptId,
      email: 'forbidden@example.com',
      schema_version: 1
    }).success,
    false
  )
})
