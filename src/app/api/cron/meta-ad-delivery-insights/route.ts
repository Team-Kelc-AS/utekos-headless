import {
  syncMetaAdDeliveryInsights,
  type MetaAdDeliveryInsightsSyncResult
} from '../../../../lib/analytics/server/syncMetaAdDeliveryInsights'
import { hasValidCronAuthorization } from '../../../../lib/security/hasValidCronAuthorization'

export const maxDuration = 60

export type MetaAdDeliveryInsightsCronDependencies = {
  getCronSecret: () => string | undefined
  sync: () => Promise<MetaAdDeliveryInsightsSyncResult>
}

const defaultDependencies: MetaAdDeliveryInsightsCronDependencies = {
  getCronSecret: () => process.env.CRON_SECRET,
  sync: syncMetaAdDeliveryInsights
}

export async function handleMetaAdDeliveryInsightsCron(
  request: Request,
  dependencies: MetaAdDeliveryInsightsCronDependencies =
    defaultDependencies
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

  const result: MetaAdDeliveryInsightsSyncResult =
    await dependencies.sync()

  return Response.json(
    { ...result, ok: true },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleMetaAdDeliveryInsightsCron(request)
}
