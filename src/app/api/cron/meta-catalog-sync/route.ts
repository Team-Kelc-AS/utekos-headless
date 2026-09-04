import { syncMetaCatalog } from '@/lib/merchant-feeds/meta/syncMetaCatalog'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'

export const maxDuration = 60

export type MetaCatalogSyncCronDependencies = {
  getAccessToken: () => string | undefined
  getCronSecret: () => string | undefined
  isEnabled: () => boolean
  sync: typeof syncMetaCatalog
}

const defaultDependencies: MetaCatalogSyncCronDependencies = {
  getAccessToken: () => process.env.CATALOG_API_TOKEN,
  getCronSecret: () => process.env.CRON_SECRET,
  isEnabled: () => process.env.META_CATALOG_SYNC_ENABLED === 'true',
  sync: syncMetaCatalog
}

export async function handleMetaCatalogSyncCron(
  request: Request,
  dependencies: MetaCatalogSyncCronDependencies = defaultDependencies
) {
  if (
    !hasValidCronAuthorization(
      request.headers.get('authorization'),
      dependencies.getCronSecret()
    )
  ) {
    return Response.json(
      { ok: false },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  if (!dependencies.isEnabled()) {
    return Response.json(
      { ok: false, reason: 'meta_catalog_sync_disabled' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const accessToken = dependencies.getAccessToken()?.trim()

  if (!accessToken) {
    return Response.json(
      { ok: false, reason: 'catalog_api_token_missing' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const result = await dependencies.sync({ accessToken })

  return Response.json(
    { ok: true, ...result },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

export function GET(request: Request) {
  return handleMetaCatalogSyncCron(request)
}
