import 'server-only'

import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import { readMetaMarketingApiConfig } from '@/lib/meta/metaMarketingApiConfig'
import {
  describeMetaMarketingConnectionError,
  verifyMetaMarketingConnection,
  type MetaMarketingConnectionStatus
} from '@/lib/meta/verifyMetaMarketingConnection'

export const maxDuration = 30

export type MetaConnectionRouteDependencies = {
  getAuthorizationSecret: () => string | undefined
  verify: () => Promise<MetaMarketingConnectionStatus>
}

const defaultDependencies: MetaConnectionRouteDependencies = {
  getAuthorizationSecret: () => process.env.CRON_SECRET,
  verify: () =>
    verifyMetaMarketingConnection(readMetaMarketingApiConfig())
}

export async function handleMetaConnectionGet(
  request: Request,
  dependencies: MetaConnectionRouteDependencies = defaultDependencies
) {
  const authorized = hasValidCronAuthorization(
    request.headers.get('authorization'),
    dependencies.getAuthorizationSecret()
  )

  if (!authorized) {
    return Response.json(
      { ok: false },
      { headers: { 'Cache-Control': 'no-store' }, status: 401 }
    )
  }

  try {
    const status = await dependencies.verify()
    return Response.json(status, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    return Response.json(
      {
        ...describeMetaMarketingConnectionError(error),
        ok: false
      },
      { headers: { 'Cache-Control': 'no-store' }, status: 503 }
    )
  }
}

export function GET(request: Request) {
  return handleMetaConnectionGet(request)
}
