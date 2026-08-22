import {
  runAbandonedCheckoutRecoveryDiscovery
} from '@/lib/email/abandonedCheckoutRecovery/runAbandonedCheckoutRecoveryDiscovery'
import {
  runAbandonedCheckoutRecoveryDispatchBatch
} from '@/lib/email/abandonedCheckoutRecovery/runAbandonedCheckoutRecoveryDispatchBatch'
import {
  purgeExpiredAbandonedCheckoutRecoveryDeliveryAudit
} from '@/lib/email/abandonedCheckoutRecovery/purgeExpiredAbandonedCheckoutRecoveryDeliveryAudit'

export type AbandonedCheckoutRecoveryWorkflowInput = {
  activationAt: string
  workerId: string
}

async function discoverRecoveryDispatches(
  activationAt: string
) {
  'use step'

  const summary = await runAbandonedCheckoutRecoveryDiscovery({
    activationAt: new Date(activationAt)
  })

  console.info('[abandoned-checkout-recovery] discovery complete', {
    candidatesDiscovered: summary.candidatesDiscovered,
    dispatchPlansBuilt: summary.dispatchPlansBuilt,
    pendingPlans: summary.pendingPlans,
    suppressedPlans: summary.suppressedPlans
  })

  return summary
}

async function dispatchDueRecoveryEmails(
  workerId: string
) {
  'use step'

  const summary = await runAbandonedCheckoutRecoveryDispatchBatch({
    workerId,
    limit: 10,
    leaseSeconds: 120
  })

  console.info('[abandoned-checkout-recovery] dispatch complete', summary)

  return summary
}

async function purgeExpiredDeliveryAudit() {
  'use step'

  const deleted =
    await purgeExpiredAbandonedCheckoutRecoveryDeliveryAudit()

  console.info('[abandoned-checkout-recovery] retention complete', {
    deleted
  })

  return { deleted }
}

export async function abandonedCheckoutRecoveryWorkflow(
  input: AbandonedCheckoutRecoveryWorkflowInput
) {
  'use workflow'

  const auditPurge = await purgeExpiredDeliveryAudit()
  const discovery = await discoverRecoveryDispatches(
    input.activationAt
  )
  const dispatch = await dispatchDueRecoveryEmails(
    input.workerId
  )

  console.info('[abandoned-checkout-recovery] workflow complete', {
    workerId: input.workerId,
    claimed: dispatch.claimed,
    sent: dispatch.sent
  })

  return {
    discovery,
    dispatch,
    auditPurge
  }
}
