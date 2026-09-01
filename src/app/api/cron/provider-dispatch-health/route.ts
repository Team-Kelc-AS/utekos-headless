import { randomUUID } from 'node:crypto'
import { start } from 'workflow/api'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import {
  skreddersyVarmenLaunchGuardWorkflow
} from '@/workflows/skreddersyVarmenLaunchGuard'

export const maxDuration = 60
const PRODUCTION_ORIGIN = 'https://utekos.no'

type Dependencies = {
  createRunId: () => string
  getCronSecret: () => string | undefined
  getEnabled: () => string | undefined
  getOrigin: () => string
  now: () => Date
  reportStartFailure: (error: unknown) => void
  startWorkflow: (input: {
    origin: string
    requestedAt: string
    runId: string
  }) => Promise<{ runId: string }>
}

const defaultDependencies: Dependencies = {
  createRunId: randomUUID,
  getCronSecret: () => process.env.CRON_SECRET,
  getEnabled: () => process.env.LAUNCH_GUARD_ENABLED,
  getOrigin: () =>
    process.env.LAUNCH_GUARD_ORIGIN ?? PRODUCTION_ORIGIN,
  now: () => new Date(),
  reportStartFailure: error =>
    reportOperationalError({
      error,
      event: 'launch_guard.workflow_start_failed',
      context: { route: 'provider-dispatch-health' }
    }),
  startWorkflow: async input => {
    const run = await start(
      skreddersyVarmenLaunchGuardWorkflow,
      [input]
    )
    return { runId: run.runId }
  }
}

const noStoreHeaders = { 'Cache-Control': 'no-store' } as const

function normalizeOrigin(value: string) {
  const url = new URL(value)
  if (url.protocol !== 'https:') {
    throw new Error('launch_guard_origin_must_use_https')
  }
  url.pathname = '/'
  url.search = ''
  url.hash = ''
  return url.origin
}

export async function handleProviderDispatchHealthCron(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  if (
    !hasValidCronAuthorization(
      request.headers.get('authorization'),
      dependencies.getCronSecret()
    )
  ) {
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
  if (enabled === 'false') {
    return Response.json(
      { ok: true, enabled: false },
      { headers: noStoreHeaders }
    )
  }

  let origin: string
  try {
    origin = normalizeOrigin(dependencies.getOrigin())
  } catch {
    return Response.json(
      { ok: false, error: 'invalid_launch_guard_origin' },
      { status: 500, headers: noStoreHeaders }
    )
  }

  const launchGuardRunId = dependencies.createRunId()
  try {
    const workflow = await dependencies.startWorkflow({
      origin,
      requestedAt: dependencies.now().toISOString(),
      runId: launchGuardRunId
    })

    return Response.json(
      {
        ok: true,
        enabled: true,
        launch_guard_run_id: launchGuardRunId,
        workflow_run_id: workflow.runId
      },
      { status: 202, headers: noStoreHeaders }
    )
  } catch (error) {
    dependencies.reportStartFailure(error)
    return Response.json(
      { ok: false, error: 'workflow_start_failed' },
      { status: 503, headers: noStoreHeaders }
    )
  }
}

export function GET(request: Request) {
  return handleProviderDispatchHealthCron(request)
}
