import {
  providerOutboxWorkerRegistry
} from './providerOutboxWorkerRegistry'
import type { RegisteredProviderAdapterKey } from './providerAdapterRegistry'
import type { ProviderOutboxBatchSummary } from './runProviderOutboxWorker'
import { listDueProviderOutboxAdapterKeys } from './listDueProviderOutboxAdapterKeys'

export type RegisteredProviderOutboxBatchSummary = Partial<
  Record<
    RegisteredProviderAdapterKey,
    ProviderOutboxBatchSummary
  >
>

type RegisteredWorker = (input: {
  maxItems: number
}) => Promise<ProviderOutboxBatchSummary>

export type RegisteredProviderOutboxBatchDependencies = Record<
  RegisteredProviderAdapterKey,
  RegisteredWorker
>

export type RegisteredProviderOutboxBatchRuntimeDependencies = {
  listDueAdapterKeys: () => Promise<RegisteredProviderAdapterKey[]>
  workers: RegisteredProviderOutboxBatchDependencies
}

const defaultDependencies: RegisteredProviderOutboxBatchRuntimeDependencies =
  {
    listDueAdapterKeys: listDueProviderOutboxAdapterKeys,
    workers: providerOutboxWorkerRegistry
  }

export async function runRegisteredProviderOutboxBatch(
  input: { maxItems: number },
  dependencies: RegisteredProviderOutboxBatchRuntimeDependencies =
    defaultDependencies
): Promise<RegisteredProviderOutboxBatchSummary> {
  const dueAdapterKeys = await dependencies.listDueAdapterKeys()
  const results = await Promise.all(
    dueAdapterKeys.map(async key => {
      const runBatch = dependencies.workers[key]
      return [key, await runBatch(input)] as const
    })
  )

  return Object.fromEntries(
    results
  ) as RegisteredProviderOutboxBatchSummary
}
