import {
  syncMetaDatasetQuality,
  type MetaDatasetQualitySyncResult
} from '../../../../lib/analytics/server/syncMetaDatasetQuality'
import type { AppLogInput } from '../../../../lib/observability/logging/appLogContract'
import { hasValidCronAuthorization } from '../../../../lib/security/hasValidCronAuthorization'
import { logToAppLogs } from '../../../../lib/utils/logToAppLogs'

export const maxDuration = 60
export type MetaDatasetQualityRunKind = 'primary' | 'retry'

export type MetaDatasetQualityCronDependencies = {
  getCronSecret: () => string | undefined
  log: (input: AppLogInput) => Promise<unknown>
  sync: () => Promise<MetaDatasetQualitySyncResult>
}

const defaultDependencies: MetaDatasetQualityCronDependencies = {
  getCronSecret: () => process.env.CRON_SECRET,
  log: logToAppLogs,
  sync: syncMetaDatasetQuality
}

export async function handleMetaDatasetQualityCron(
  request: Request,
  dependencies: MetaDatasetQualityCronDependencies = defaultDependencies,
  runKind: MetaDatasetQualityRunKind = 'primary'
) {
  const authorized = hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getCronSecret()
  )

  if (!authorized) {
    return Response.json(
      { ok: false, runKind },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  const result: MetaDatasetQualitySyncResult =
    await dependencies.sync()

  if (runKind === 'retry' && !result.complete) {
    try {
      await dependencies.log({
        context: {},
        data: {
          datasetId: result.datasetId,
          missingRequiredEvents: result.missingRequiredEvents,
          snapshotDate: result.measuredAt.slice(0, 10)
        },
        event: 'meta_dataset_quality.incomplete',
        level: 'WARN'
      })
    } catch {
      // Reporting is best-effort and must not alter cron health.
    }
  }

  return Response.json(
    { ...result, ok: true, runKind },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleMetaDatasetQualityCron(request)
}
