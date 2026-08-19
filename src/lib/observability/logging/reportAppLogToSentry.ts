import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { metaDatasetQualityIncompleteDataSchema } from '@/lib/observability/logging/appLogContract'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import type { AppLogEntry } from 'types/observability/log/AppLogEntry'

export type ReportAppLogToSentryDependencies = {
  captureMessage: typeof Sentry.captureMessage
  flush: typeof Sentry.flush
  getRuntime: typeof getVercelRuntimeContext
}

const defaultDependencies: ReportAppLogToSentryDependencies = {
  captureMessage: Sentry.captureMessage,
  flush: Sentry.flush,
  getRuntime: getVercelRuntimeContext
}

export async function reportAppLogToSentry(
  logEntry: AppLogEntry,
  dependencies: ReportAppLogToSentryDependencies = defaultDependencies
): Promise<void> {
  if (logEntry.level !== 'WARN' && logEntry.level !== 'ERROR') return

  const runtime = dependencies.getRuntime()
  const incompleteData =
    logEntry.event === 'meta_dataset_quality.incomplete'
      ? metaDatasetQualityIncompleteDataSchema.safeParse(logEntry.data)
      : undefined

  dependencies.captureMessage(logEntry.event, {
    ...(incompleteData?.success
      ? {
          fingerprint: [
            logEntry.event,
            incompleteData.data.datasetId,
            incompleteData.data.snapshotDate
          ]
        }
      : {}),
    level: logEntry.level === 'WARN' ? 'warning' : 'error',
    tags: {
      app_log_id: logEntry.id,
      vercel_environment: runtime.environment,
      vercel_region: runtime.region ?? 'unknown',
      vercel_deployment_id: runtime.deploymentId ?? 'local'
    },
    extra: {
      ...logEntry,
      commitSha: runtime.commitSha
    }
  })

  await dependencies.flush(1_500)
}
