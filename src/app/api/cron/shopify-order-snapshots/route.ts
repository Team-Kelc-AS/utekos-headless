import {
  runShopifyOrderSnapshotSync,
  type ShopifyOrderSnapshotSyncSummary
} from '@/lib/analytics/server/runShopifyOrderSnapshotSync'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'

export const maxDuration = 60

export type ShopifyOrderSnapshotCronDependencies = {
  getCronSecret: () => string | undefined
  runSnapshotSync: () => Promise<ShopifyOrderSnapshotSyncSummary>
}

const defaultDependencies: ShopifyOrderSnapshotCronDependencies =
  {
    getCronSecret: () => process.env.CRON_SECRET,
    runSnapshotSync: runShopifyOrderSnapshotSync
  }

export async function handleShopifyOrderSnapshotCron(
  request: Request,
  dependencies: ShopifyOrderSnapshotCronDependencies = defaultDependencies
) {
  if (
    !hasValidCronAuthorization(
      request.headers.get('authorization'),
      dependencies.getCronSecret()
    )
  ) {
    return Response.json(
      { ok: false },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  const summary = await dependencies.runSnapshotSync()
  return Response.json(summary, {
    headers: { 'Cache-Control': 'no-store' },
    status: summary.ok ? 200 : 500
  })
}

export function GET(request: Request) {
  return handleShopifyOrderSnapshotCron(request)
}
