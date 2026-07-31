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

test('runs every registered provider-event worker without event-specific orchestration', async () => {
  const calls: string[] = []
  const result = await runRegisteredProviderOutboxBatch(
    { maxItems: 3 },
    stubWorkers(calls)
  )

  assert.equal(calls.length, providerAdapterKeys.length)
  for (const key of providerAdapterKeys) {
    assert.ok(calls.includes(`${key}:3`))
    assert.deepEqual(result[key], summary)
  }
})
