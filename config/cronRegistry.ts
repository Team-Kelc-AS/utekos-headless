/**
 * Single source of truth for Vercel cron schedules.
 *
 * vercel.ts builds its `crons` array from SCHEDULED_CRONS, and
 * cronRegistry.test.ts asserts the registry matches the route files under
 * src/app/api/cron: every cron route must appear here — scheduled or
 * explicitly documented as unscheduled — so dead routes like the
 * formerly unscheduled meta-view-item-dispatch can never go unnoticed.
 */
export type ScheduledCron = {
  path: string
  schedule: string
}

export type UnscheduledCronRoute = {
  path: string
  reason: string
}

export const SCHEDULED_CRONS: ScheduledCron[] = [
  { path: '/api/cron/provider-outbox-dispatch', schedule: '*/5 * * * *' },
  { path: '/api/cron/shopify-dun-waitlist-sync', schedule: '*/5 * * * *' },
  {
    path: '/api/cron/abandoned-checkout-recovery',
    schedule: '*/5 * * * *'
  },
  {
    path: '/api/cron/shopify-order-snapshots',
    schedule: '*/15 * * * *'
  },
  {
    path: '/api/cron/google-data-manager-status',
    schedule: '*/5 * * * *'
  },
  {
    path: '/api/cron/provider-dispatch-health',
    schedule: '*/5 * * * *'
  },
  { path: '/api/cron/meta-dataset-quality', schedule: '17 3 * * *' },
  {
    path: '/api/cron/meta-dataset-quality-retry',
    schedule: '17 4 * * *'
  },
  {
    path: '/api/cron/meta-ad-delivery-insights',
    schedule: '17 10 * * *'
  }
]

export const UNSCHEDULED_CRON_ROUTES: UnscheduledCronRoute[] = [
  {
    path: '/api/cron/meta-view-item-dispatch',
    reason:
      'Shares its handler with provider-outbox-dispatch and runs through ' +
      'the generic outbox path. No dedicated timer; keep the route for ' +
      'manual invocation only.'
  },
  {
    path: '/api/cron/shopify-commerce-reconciliation',
    reason:
      'Unscheduled as of 2026-09-24: no timer ever configured. Verify the ' +
      'intended trigger (manual, queue-driven, or missing schedule) before ' +
      'removing or scheduling.'
  },
  {
    path: '/api/cron/sync-google-merchant',
    reason:
      'Unscheduled as of 2026-09-24: no timer ever configured. Verify the ' +
      'intended trigger (manual, queue-driven, or missing schedule) before ' +
      'removing or scheduling.'
  }
]
