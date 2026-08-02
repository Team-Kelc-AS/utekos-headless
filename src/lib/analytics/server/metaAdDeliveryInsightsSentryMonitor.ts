import 'server-only'

import * as Sentry from '@sentry/nextjs'

type MetaAdDeliveryInsightsCheckIn =
  | { status: 'in_progress' }
  | { checkInId: string; status: 'ok' | 'error' }

type MetaAdDeliveryInsightsSentryMonitorDependencies = {
  captureCheckIn: typeof Sentry.captureCheckIn
  flush: typeof Sentry.flush
}

const defaultDependencies: MetaAdDeliveryInsightsSentryMonitorDependencies = {
  captureCheckIn: Sentry.captureCheckIn,
  flush: Sentry.flush
}

export const META_AD_DELIVERY_INSIGHTS_CRON_SCHEDULE = '17 10 * * *'

const monitorSlug = 'utekos-meta-ad-delivery-insights'

export async function captureMetaAdDeliveryInsightsCheckIn(
  input: MetaAdDeliveryInsightsCheckIn,
  dependencies: MetaAdDeliveryInsightsSentryMonitorDependencies =
    defaultDependencies
): Promise<string> {
  if (input.status === 'in_progress') {
    return dependencies.captureCheckIn(
      { monitorSlug, status: 'in_progress' },
      {
        checkinMargin: 10,
        maxRuntime: 1,
        schedule: {
          type: 'crontab',
          value: META_AD_DELIVERY_INSIGHTS_CRON_SCHEDULE
        },
        timezone: 'UTC'
      }
    )
  }

  const checkInId = dependencies.captureCheckIn({
    checkInId: input.checkInId,
    monitorSlug,
    status: input.status
  })
  await dependencies.flush(1_500)
  return checkInId
}
