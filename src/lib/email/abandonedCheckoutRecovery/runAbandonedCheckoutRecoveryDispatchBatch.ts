import 'server-only'

import {
  claimAbandonedCheckoutRecoveryDispatches
} from './claimAbandonedCheckoutRecoveryDispatches'
import {
  deliverAbandonedCheckoutRecoveryEmail
} from './deliverAbandonedCheckoutRecoveryEmail'
import {
  processAbandonedCheckoutRecoveryClaim,
  type ProcessAbandonedCheckoutRecoveryClaimResult
} from './processAbandonedCheckoutRecoveryClaim'
import type {
  ClaimedAbandonedCheckoutRecoveryDispatch
} from './abandonedCheckoutRecoveryDispatch'

export type RunAbandonedCheckoutRecoveryDispatchBatchSummary = {
  claimed: number
  sent: number
  suppressed: number
  retryScheduled: number
  failed: number
  ownershipLost: number
}

type Dependencies = {
  now?: () => Date
  claim?: (input: {
    workerId: string
    limit: number
    leaseSeconds: number
    now: Date
  }) => Promise<ClaimedAbandonedCheckoutRecoveryDispatch[]>
  processClaim?: (
    claim: ClaimedAbandonedCheckoutRecoveryDispatch,
    workerId: string
  ) => Promise<ProcessAbandonedCheckoutRecoveryClaimResult>
}

export async function runAbandonedCheckoutRecoveryDispatchBatch(
  input: {
    workerId: string
    limit?: number
    leaseSeconds?: number
  },
  dependencies: Dependencies = {}
): Promise<RunAbandonedCheckoutRecoveryDispatchBatchSummary> {
  const limit = input.limit ?? 10
  const leaseSeconds = input.leaseSeconds ?? 120
  const now = (dependencies.now ?? (() => new Date()))()
  const claim = dependencies.claim
    ?? claimAbandonedCheckoutRecoveryDispatches
  const processClaim = dependencies.processClaim
    ?? ((claimed, workerId) =>
      processAbandonedCheckoutRecoveryClaim(
        {
          claim: claimed,
          workerId,
          leaseSeconds
        },
        {
          deliverAuthorizedEmail:
            deliverAbandonedCheckoutRecoveryEmail
        }
      ))

  const claims = await claim({
    workerId: input.workerId,
    limit,
    leaseSeconds,
    now
  })

  const summary: RunAbandonedCheckoutRecoveryDispatchBatchSummary = {
    claimed: claims.length,
    sent: 0,
    suppressed: 0,
    retryScheduled: 0,
    failed: 0,
    ownershipLost: 0
  }

  for (const claimed of claims) {
    const result = await processClaim(claimed, input.workerId)

    switch (result.status) {
      case 'sent':
        summary.sent += 1
        break
      case 'suppressed':
        summary.suppressed += 1
        break
      case 'retry_scheduled':
        summary.retryScheduled += 1
        break
      case 'failed':
        summary.failed += 1
        break
      case 'ownership_lost':
        summary.ownershipLost += 1
        break
    }
  }

  return summary
}
