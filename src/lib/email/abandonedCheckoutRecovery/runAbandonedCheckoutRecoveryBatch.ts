import 'server-only'

import { randomUUID } from 'node:crypto'

import { claimAbandonedCheckoutRecoveryDispatches } from './claimAbandonedCheckoutRecoveryDispatches'
import { deliverAbandonedCheckoutRecoveryEmail } from './deliverAbandonedCheckoutRecoveryEmail'
import { processAbandonedCheckoutRecoveryClaim } from './processAbandonedCheckoutRecoveryClaim'
import { runAbandonedCheckoutRecoveryDiscovery } from './runAbandonedCheckoutRecoveryDiscovery'

const BATCH_SIZE = 10

export type AbandonedCheckoutRecoveryBatchSummary = {
  discovered: number
  claimed: number
  sent: number
  suppressed: number
  retried: number
  failed: number
  ownershipLost: number
}

export async function runAbandonedCheckoutRecoveryBatch(
  activatedAt: Date
): Promise<AbandonedCheckoutRecoveryBatchSummary> {
  const discovery = await runAbandonedCheckoutRecoveryDiscovery(
    {},
    activatedAt
  )
  const workerId = `recovery:${randomUUID()}`
  const claims = await claimAbandonedCheckoutRecoveryDispatches({
    workerId,
    limit: BATCH_SIZE,
    leaseSeconds: 180
  })
  const results = await Promise.all(
    claims.map(claim =>
      processAbandonedCheckoutRecoveryClaim(
        { claim, workerId, leaseSeconds: 180 },
        { deliverAuthorizedEmail: deliverAbandonedCheckoutRecoveryEmail }
      )
    )
  )

  return {
    discovered: discovery.candidatesDiscovered,
    claimed: claims.length,
    sent: results.filter(result => result.status === 'sent').length,
    suppressed: results.filter(result => result.status === 'suppressed')
      .length,
    retried: results.filter(result => result.status === 'retry_scheduled')
      .length,
    failed: results.filter(result => result.status === 'failed').length,
    ownershipLost: results.filter(result => result.status === 'ownership_lost')
      .length
  }
}
