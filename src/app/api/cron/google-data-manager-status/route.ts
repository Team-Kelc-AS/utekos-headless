import {
  runGoogleDataManagerStatusReconciliation,
  type GoogleDataManagerStatusBatchSummary
} from '@/lib/analytics/server/runGoogleDataManagerStatusReconciliation'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'

const CRON_BATCH_SIZE = 20

export const maxDuration = 60

type RunBatch = (input: {
  maxItems: number
}) => Promise<GoogleDataManagerStatusBatchSummary>

export type GoogleDataManagerStatusCronDependencies = {
  getCronSecret: () => string | undefined
  runBatch: RunBatch
}

const defaultDependencies: GoogleDataManagerStatusCronDependencies =
  {
    getCronSecret: () => process.env.CRON_SECRET,
    runBatch: runGoogleDataManagerStatusReconciliation
  }

export async function handleGoogleDataManagerStatusCron(
  request: Request,
  dependencies: GoogleDataManagerStatusCronDependencies = defaultDependencies
) {
  const authorized = hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getCronSecret()
  )

  if (!authorized) {
    return Response.json(
      { ok: false },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  const summary = await dependencies.runBatch({
    maxItems: CRON_BATCH_SIZE
  })

  return Response.json(
    { ...summary, complete: summary.overdue === 0, ok: true },
    { headers: { 'Cache-Control': 'no-store' }, status: 200 }
  )
}

export function GET(request: Request) {
  return handleGoogleDataManagerStatusCron(request)
}
