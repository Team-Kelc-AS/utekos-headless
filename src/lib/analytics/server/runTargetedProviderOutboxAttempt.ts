import type { CanonicalEvent } from '../canonicalEvent'
import { createProviderOutboxStore } from './createProviderOutboxStore'
import { createPostgresProviderOutboxDatabase } from './postgresProviderOutboxStore'
import type { ProviderAdapter } from './providerAdapter'
import {
  processProviderOutboxAttempt
} from './processProviderOutboxAttempt'
import {
  providerAdapterRegistry,
  type RegisteredProviderAdapterKey
} from './providerAdapterRegistry'

export type TargetedProviderOutboxResult = {
  status:
    | 'accepted_unverified'
    | 'dead_lettered'
    | 'not_claimed'
    | 'retry_scheduled'
}

type TargetedProviderOutboxRunner = (
  attemptId: string
) => Promise<TargetedProviderOutboxResult>

function createTargetedProviderOutboxRunner(
  adapter: ProviderAdapter<CanonicalEvent, unknown>
): TargetedProviderOutboxRunner {
  const store = createProviderOutboxStore(
    adapter,
    createPostgresProviderOutboxDatabase(adapter)
  )

  return async attemptId => {
    if (!store.claimById) {
      throw new Error('targeted_provider_claim_not_supported')
    }

    const attempt = await store.claimById(attemptId)
    if (!attempt) return { status: 'not_claimed' }

    const outcome = await processProviderOutboxAttempt(
      attempt,
      adapter
    )
    await store.complete(outcome)

    return {
      status:
        outcome.status === 'succeeded' ?
          'accepted_unverified'
        : outcome.status
    }
  }
}

export const targetedProviderOutboxWorkerRegistry =
  Object.fromEntries(
    Object.entries(providerAdapterRegistry).map(
      ([key, adapter]) => [
        key,
        createTargetedProviderOutboxRunner(
          adapter as ProviderAdapter<CanonicalEvent, unknown>
        )
      ]
    )
  ) as Record<
    RegisteredProviderAdapterKey,
    TargetedProviderOutboxRunner
  >

export async function runTargetedProviderOutboxAttempt(
  input: {
    adapterKey: RegisteredProviderAdapterKey
    attemptId: string
  },
  workers: Record<
    RegisteredProviderAdapterKey,
    TargetedProviderOutboxRunner
  > = targetedProviderOutboxWorkerRegistry
) {
  return workers[input.adapterKey](input.attemptId)
}
