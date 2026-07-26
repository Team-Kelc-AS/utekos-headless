import 'server-only'

import * as Sentry from '@sentry/nextjs'

export type MetaDatasetQualityRunKind = 'primary' | 'retry'

type MetaDatasetQualityCheckIn =
  | {
      runKind: MetaDatasetQualityRunKind
      status: 'in_progress'
    }
  | {
      checkInId: string
      runKind: MetaDatasetQualityRunKind
      status: 'ok' | 'error'
    }

type MetaDatasetQualitySentryMonitorDependencies = {
  captureCheckIn: typeof Sentry.captureCheckIn
  flush: typeof Sentry.flush
}

const defaultDependencies: MetaDatasetQualitySentryMonitorDependencies = {
  captureCheckIn: Sentry.captureCheckIn,
  flush: Sentry.flush
}

const monitors = {
  primary: {
    monitorSlug: 'utekos-meta-dataset-quality-primary',
    schedule: '17 3 * * *'
  },
  retry: {
    monitorSlug: 'utekos-meta-dataset-quality-retry',
    schedule: '17 4 * * *'
  }
} as const

export async function captureMetaDatasetQualityCheckIn(
  input: MetaDatasetQualityCheckIn,
  dependencies: MetaDatasetQualitySentryMonitorDependencies =
    defaultDependencies
): Promise<string> {
  const monitor = monitors[input.runKind]

  if (input.status === 'in_progress') {
    return dependencies.captureCheckIn(
      {
        monitorSlug: monitor.monitorSlug,
        status: 'in_progress'
      },
      {
        checkinMargin: 5,
        maxRuntime: 1,
        schedule: { type: 'crontab', value: monitor.schedule },
        timezone: 'UTC'
      }
    )
  }

  const checkInId = dependencies.captureCheckIn({
    checkInId: input.checkInId,
    monitorSlug: monitor.monitorSlug,
    status: input.status
  })
  await dependencies.flush(1_500)
  return checkInId
}
