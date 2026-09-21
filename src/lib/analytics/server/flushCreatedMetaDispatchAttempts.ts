import type { CreatedProviderDispatchAttempt } from './canonicalEventStore'
import type { RegisteredProviderAdapterKey } from './providerAdapterRegistry'

type TargetedProviderOutboxResult = {
  status:
    | 'accepted_unverified'
    | 'dead_lettered'
    | 'not_claimed'
    | 'retry_scheduled'
}

type RunTargetedAttempt = (input: {
  adapterKey: RegisteredProviderAdapterKey
  attemptId: string
}) => Promise<TargetedProviderOutboxResult>

function isMetaDispatchAttempt(
  attempt: CreatedProviderDispatchAttempt
): attempt is CreatedProviderDispatchAttempt & {
  adapterKey: RegisteredProviderAdapterKey
} {
  return attempt.adapterKey.startsWith('meta:')
}

async function defaultRunAttempt(input: {
  adapterKey: RegisteredProviderAdapterKey
  attemptId: string
}): Promise<TargetedProviderOutboxResult> {
  const { runTargetedProviderOutboxAttempt } = await import(
    './runTargetedProviderOutboxAttempt'
  )
  return runTargetedProviderOutboxAttempt(input)
}

export async function flushCreatedMetaDispatchAttempts(
  attempts: CreatedProviderDispatchAttempt[],
  runAttempt: RunTargetedAttempt = defaultRunAttempt
) {
  const metaAttempts = attempts.filter(isMetaDispatchAttempt)

  if (metaAttempts.length === 0) return

  await Promise.all(
    metaAttempts.map(attempt =>
      runAttempt({
        adapterKey: attempt.adapterKey,
        attemptId: attempt.attemptId
      }).catch(() => ({ status: 'not_claimed' as const }))
    )
  )
}
