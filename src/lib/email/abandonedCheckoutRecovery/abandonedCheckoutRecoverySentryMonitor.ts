import 'server-only'

import * as Sentry from '@sentry/nextjs'

const MONITOR_SLUG = 'utekos-abandoned-checkout-recovery'

export function startAbandonedCheckoutRecoveryCheckIn(): string {
  return Sentry.captureCheckIn(
    { monitorSlug: MONITOR_SLUG, status: 'in_progress' },
    {
      checkinMargin: 2,
      maxRuntime: 1,
      schedule: { type: 'crontab', value: '*/5 * * * *' },
      timezone: 'UTC'
    }
  )
}

export async function finishAbandonedCheckoutRecoveryCheckIn(
  checkInId: string,
  status: 'ok' | 'error'
): Promise<void> {
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug: MONITOR_SLUG,
    status
  })
  await Sentry.flush(1_500)
}
