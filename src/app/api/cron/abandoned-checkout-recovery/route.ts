import { randomUUID } from 'node:crypto'

import { start } from 'workflow/api'

import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import {
  abandonedCheckoutRecoveryWorkflow
} from '@/workflows/abandonedCheckoutRecovery'

export const maxDuration = 60

type Dependencies = {
  getCronSecret: () => string | undefined
  getEnabled: () => string | undefined
  getActivationAt: () => string | undefined
  createWorkerId: () => string
  startWorkflow: (input: {
    activationAt: string
    workerId: string
  }) => Promise<{ runId: string }>
}

const defaultDependencies: Dependencies = {
  getCronSecret: () => process.env.CRON_SECRET,
  getEnabled: () =>
    process.env.ABANDONED_CHECKOUT_RECOVERY_ENABLED,
  getActivationAt: () =>
    process.env.ABANDONED_CHECKOUT_RECOVERY_ACTIVATION_AT,
  createWorkerId: () => `acr:${randomUUID()}`,
  startWorkflow: async input => {
    const run = await start(
      abandonedCheckoutRecoveryWorkflow,
      [input]
    )

    return { runId: run.runId }
  }
}

const noStoreHeaders = {
  'Cache-Control': 'no-store'
} as const

function parseActivationAt(value: string | undefined): string | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString()
    : null
}

export async function handleAbandonedCheckoutRecoveryCron(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  if (!hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getCronSecret()
  )) {
    return Response.json(
      { ok: false },
      { status: 401, headers: noStoreHeaders }
    )
  }

  const enabled = dependencies.getEnabled()

  if (enabled !== undefined && enabled !== 'true' && enabled !== 'false') {
    return Response.json(
      { ok: false, error: 'invalid_activation_gate' },
      { status: 500, headers: noStoreHeaders }
    )
  }

  if (enabled !== 'true') {
    return Response.json(
      { ok: true, enabled: false },
      { headers: noStoreHeaders }
    )
  }

  const activationAt = parseActivationAt(
    dependencies.getActivationAt()
  )

  if (!activationAt) {
    return Response.json(
      { ok: false, error: 'invalid_activation_at' },
      { status: 500, headers: noStoreHeaders }
    )
  }

  try {
    const run = await dependencies.startWorkflow({
      activationAt,
      workerId: dependencies.createWorkerId()
    })

    return Response.json(
      {
        ok: true,
        enabled: true,
        runId: run.runId
      },
      { status: 202, headers: noStoreHeaders }
    )
  } catch {
    return Response.json(
      { ok: false, error: 'workflow_start_failed' },
      { status: 503, headers: noStoreHeaders }
    )
  }
}

export function GET(request: Request) {
  return handleAbandonedCheckoutRecoveryCron(request)
}
