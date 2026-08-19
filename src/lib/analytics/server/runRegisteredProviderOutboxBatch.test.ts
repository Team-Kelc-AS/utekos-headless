import assert from 'node:assert/strict'
import test from 'node:test'
import {
  providerAdapterRegistry,
  type RegisteredProviderAdapterKey
} from './providerAdapterRegistry'
import { runRegisteredProviderOutboxBatch } from './runRegisteredProviderOutboxBatch'
import type { RegisteredProviderOutboxBatchDependencies } from './runRegisteredProviderOutboxBatch'

const summary = {
  acceptedUnverified: 1,
  claimed: 1,
  deadLettered: 0,
  limitReached: false,
  retryScheduled: 0
}

const providerAdapterKeys = Object.keys(
  providerAdapterRegistry
) as RegisteredProviderAdapterKey[]

function stubWorkers(
  calls: string[]
): RegisteredProviderOutboxBatchDependencies {
  return Object.fromEntries(
    providerAdapterKeys.map(key => [
      key,
      async (input: { maxItems: number }) => {
        calls.push(`${key}:${input.maxItems}`)
        return summary
      }
    ])
  ) as RegisteredProviderOutboxBatchDependencies
}

test('runs only provider-event workers with due fallback rows', async () => {
  const calls: string[] = []
  const dueAdapterKeys = providerAdapterKeys.slice(0, 3)
  const result = await runRegisteredProviderOutboxBatch(
    { maxItems: 3 },
    {
      listDueAdapterKeys: async () => dueAdapterKeys,
      workers: stubWorkers(calls)
    }
  )

  assert.equal(calls.length, dueAdapterKeys.length)
  for (const key of dueAdapterKeys) {
    assert.ok(calls.includes(`${key}:3`))
    assert.deepEqual(result[key], summary)
  }
})

test('performs no worker claims when no fallback rows are due', async () => {
  const calls: string[] = []
  const result = await runRegisteredProviderOutboxBatch(
    { maxItems: 3 },
    {
      listDueAdapterKeys: async () => [],
      workers: stubWorkers(calls)
    }
  )

  assert.deepEqual(calls, [])
  assert.deepEqual(result, {})
})
