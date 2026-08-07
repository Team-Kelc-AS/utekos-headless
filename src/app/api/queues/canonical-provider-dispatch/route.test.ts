import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { CanonicalProviderDispatchQueueDependencies } from './route'

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
const { handleCanonicalProviderDispatchQueueMessage } =
  require('./route.ts') as typeof import('./route')

const validMessage = {
  adapter_key: 'meta:view_cart' as const,
  attempt_id: '7bcd24a4-190c-4eca-a834-5c9854bd54ea',
  schema_version: 1 as const
}

test('acks an invalid PII-free envelope after reporting it', async () => {
  const messages: string[] = []
  const dependencies: CanonicalProviderDispatchQueueDependencies = {
    captureMessage: message => {
      messages.push(message)
      return 'event-id'
    },
    runAttempt: async () => {
      throw new Error('must not run')
    }
  }

  const result = await handleCanonicalProviderDispatchQueueMessage(
    { ...validMessage, unexpected: true },
    dependencies
  )

  assert.deepEqual(result, { status: 'invalid_message' })
  assert.deepEqual(messages, [
    'Invalid canonical provider dispatch queue message'
  ])
})

test('dispatches exactly the attempt primary key and adapter key', async () => {
  const calls: unknown[] = []
  const dependencies: CanonicalProviderDispatchQueueDependencies = {
    captureMessage: () => 'event-id',
    runAttempt: async input => {
      calls.push(input)
      return { status: 'accepted_unverified' }
    }
  }

  const result = await handleCanonicalProviderDispatchQueueMessage(
    validMessage,
    dependencies
  )

  assert.deepEqual(calls, [
    {
      adapterKey: 'meta:view_cart',
      attemptId: validMessage.attempt_id
    }
  ])
  assert.deepEqual(result, { status: 'accepted_unverified' })
})

test('acks provider-classified retry and dead-letter outcomes', async () => {
  for (const status of [
    'retry_scheduled',
    'dead_lettered'
  ] as const) {
    const result = await handleCanonicalProviderDispatchQueueMessage(
      validMessage,
      {
        captureMessage: () => 'event-id',
        runAttempt: async () => ({ status })
      }
    )

    assert.deepEqual(result, { status })
  }
})

test('propagates infrastructure errors for Queue redelivery', async () => {
  await assert.rejects(
    handleCanonicalProviderDispatchQueueMessage(validMessage, {
      captureMessage: () => 'event-id',
      runAttempt: async () => {
        throw new Error('database connection unavailable')
      }
    }),
    /database connection unavailable/
  )
})
