import {
  syncMetaDatasetQuality,
  type MetaDatasetQualitySyncResult
} from '../../../../lib/analytics/server/syncMetaDatasetQuality'
import {
  captureMetaDatasetQualityCheckIn,
  type MetaDatasetQualityRunKind
} from '../../../../lib/analytics/server/metaDatasetQualitySentryMonitor'
import type { AppLogInput } from '../../../../lib/observability/logging/appLogContract'
import { hasValidCronAuthorization } from '../../../../lib/security/hasValidCronAuthorization'
import { logToAppLogs } from '../../../../lib/utils/logToAppLogs'

export const maxDuration = 60

export type MetaDatasetQualityCronDependencies = {
  checkIn: typeof captureMetaDatasetQualityCheckIn
  getCronSecret: () => string | undefined
  log: (input: AppLogInput) => Promise<unknown>
  sync: () => Promise<MetaDatasetQualitySyncResult>
}

const defaultDependencies: MetaDatasetQualityCronDependencies = {
  checkIn: captureMetaDatasetQualityCheckIn,
  getCronSecret: () => process.env.CRON_SECRET,
  log: logToAppLogs,
  sync: syncMetaDatasetQuality
}

async function safelyCaptureCheckIn(
  dependencies: MetaDatasetQualityCronDependencies,
  input: Parameters<MetaDatasetQualityCronDependencies['checkIn']>[0]
): Promise<string | undefined> {
  try {
    return await dependencies.checkIn(input)
  } catch {
    return undefined
  }
}

export async function handleMetaDatasetQualityCron(
  request: Request,
  dependencies: MetaDatasetQualityCronDependencies = defaultDependencies,
  runKind: MetaDatasetQualityRunKind = 'primary'
) {
  const checkInId = await safelyCaptureCheckIn(dependencies, {
    runKind,
    status: 'in_progress'
  })
  const authorized = hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getCronSecret()
  )

  if (!authorized) {
    if (checkInId) {
      await safelyCaptureCheckIn(dependencies, {
        checkInId,
        runKind,
        status: 'error'
      })
    }
    return Response.json(
      { ok: false, runKind },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  let result: MetaDatasetQualitySyncResult
  try {
    result = await dependencies.sync()
  } catch (error) {
    if (checkInId) {
      await safelyCaptureCheckIn(dependencies, {
        checkInId,
        runKind,
        status: 'error'
      })
    }
    throw error
  }

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

  if (checkInId) {
    await safelyCaptureCheckIn(dependencies, {
      checkInId,
      runKind,
      status: 'ok'
    })
  }

  return Response.json(
    { ...result, ok: true, runKind },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleMetaDatasetQualityCron(request)
}
