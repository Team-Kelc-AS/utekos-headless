import {
  collectInitialLaunchGuardHealth,
  retryLaunchGuardFailures
} from '@/lib/observability/launchGuard/collectLaunchGuardHealth'
import { dispatchIntegrationHealthAlerts } from '@/lib/observability/launchGuard/dispatchIntegrationHealthAlerts'
import type { IntegrationHealthSnapshot } from '@/lib/observability/launchGuard/integrationHealthSnapshot'
import { planIntegrationHealthAlerts } from '@/lib/observability/launchGuard/planIntegrationHealthAlerts'
import { postgresIntegrationHealthStore } from '@/lib/observability/launchGuard/postgresIntegrationHealthStore'

export type SkreddersyVarmenLaunchGuardWorkflowInput = {
  origin: string
  requestedAt: string
  runId: string
}

async function detectLaunchGuardHealth(
  input: SkreddersyVarmenLaunchGuardWorkflowInput
) {
  'use step'

  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) throw new Error('launch_guard_cron_secret_missing')

  return collectInitialLaunchGuardHealth({
    cronSecret,
    origin: input.origin,
    runId: input.runId
  })
}

async function verifyLaunchGuardHealth(
  input: SkreddersyVarmenLaunchGuardWorkflowInput,
  initial: readonly IntegrationHealthSnapshot[]
) {
  'use step'

  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) throw new Error('launch_guard_cron_secret_missing')

  return retryLaunchGuardFailures({
    cronSecret,
    initial,
    origin: input.origin,
    runId: input.runId
  })
}

async function reconcileLaunchGuardIncidents(
  snapshots: readonly IntegrationHealthSnapshot[]
) {
  'use step'

  const reconciled =
    await postgresIntegrationHealthStore.persistAndReconcile(
      snapshots,
      new Date()
    )
  const alerts = planIntegrationHealthAlerts(reconciled)

  return {
    alerts,
    incidentCount: reconciled.incidents.length,
    recoveryCount: reconciled.recoveries.length
  }
}

async function notifyLaunchGuardIncidents(
  alerts: ReturnType<typeof planIntegrationHealthAlerts>
) {
  'use step'

  return dispatchIntegrationHealthAlerts(alerts)
}

async function closeLaunchGuardRun(input: {
  alertCount: number
  healthySnapshotCount: number
  incidentCount: number
  notification: Awaited<
    ReturnType<typeof dispatchIntegrationHealthAlerts>
  >
  recoveryCount: number
  snapshotCount: number
}) {
  'use step'

  console.info('[skreddersy-varmen-launch-guard] run complete', input)
  return input
}

export async function skreddersyVarmenLaunchGuardWorkflow(
  input: SkreddersyVarmenLaunchGuardWorkflowInput
) {
  'use workflow'

  const detected = await detectLaunchGuardHealth(input)
  const verified = await verifyLaunchGuardHealth(input, detected)
  const reconciled = await reconcileLaunchGuardIncidents(verified)
  const notification = await notifyLaunchGuardIncidents(
    reconciled.alerts
  )

  return closeLaunchGuardRun({
    alertCount: reconciled.alerts.length,
    healthySnapshotCount: verified.filter(
      snapshot => snapshot.status === 'healthy'
    ).length,
    incidentCount: reconciled.incidentCount,
    notification,
    recoveryCount: reconciled.recoveryCount,
    snapshotCount: verified.length
  })
}
