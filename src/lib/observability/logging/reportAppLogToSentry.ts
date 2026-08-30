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

function readUnhandledRejectionTriage(logEntry: AppLogEntry) {
  if (logEntry.event !== 'client.unhandled_rejection') {
    return undefined
  }

  const errorName =
    typeof logEntry.data.errorName === 'string' ?
      logEntry.data.errorName
    : undefined
  const sentryEventId =
    typeof logEntry.data.sentryEventId === 'string' ?
      logEntry.data.sentryEventId
    : undefined
  const route =
    typeof logEntry.context.route === 'string' ?
      logEntry.context.route
    : 'unknown'

  return { errorName, route, sentryEventId }
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
  const unhandledRejection =
    readUnhandledRejectionTriage(logEntry)
  const fingerprint =
    incompleteData?.success ?
      [
        logEntry.event,
        incompleteData.data.datasetId,
        incompleteData.data.snapshotDate
      ]
    : unhandledRejection?.errorName ?
      [
        logEntry.event,
        unhandledRejection.errorName,
        unhandledRejection.route
      ]
    : undefined

  dependencies.captureMessage(logEntry.event, {
    ...(fingerprint ? { fingerprint } : {}),
    level: logEntry.level === 'WARN' ? 'warning' : 'error',
    tags: {
      app_log_id: logEntry.id,
      ...(unhandledRejection?.errorName ?
        { client_error_name: unhandledRejection.errorName }
      : {}),
      ...(unhandledRejection?.sentryEventId ?
        {
          client_sentry_event_id:
            unhandledRejection.sentryEventId
        }
      : {}),
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
