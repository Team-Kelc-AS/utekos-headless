import assert from 'node:assert/strict'
import test from 'node:test'
import {
  runTargetedProviderOutboxAttempt,
  type TargetedProviderOutboxResult
} from './runTargetedProviderOutboxAttempt'
import type { RegisteredProviderAdapterKey } from './providerAdapterRegistry'

test('invokes only the worker named by the queue envelope', async () => {
  const calls: string[] = []
  const workers = new Proxy(
    {},
    {
      get: (_target, key: string) => async (attemptId: string) => {
        calls.push(`${key}:${attemptId}`)
        return {
          status: 'accepted_unverified'
        } satisfies TargetedProviderOutboxResult
      }
    }
  ) as Record<
    RegisteredProviderAdapterKey,
    (attemptId: string) => Promise<TargetedProviderOutboxResult>
  >

  const result = await runTargetedProviderOutboxAttempt(
    {
      adapterKey: 'meta:view_cart',
      attemptId: '7bcd24a4-190c-4eca-a834-5c9854bd54ea'
    },
    workers
  )

  assert.deepEqual(result, { status: 'accepted_unverified' })
  assert.deepEqual(calls, [
    'meta:view_cart:7bcd24a4-190c-4eca-a834-5c9854bd54ea'
  ])
})
