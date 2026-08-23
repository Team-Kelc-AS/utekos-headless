import 'server-only'

import { verifyVercelOidcToken } from '@vercel/oidc'

function parseExpectedProjectIds(value: string | undefined) {
  if (!value) {
    return []
  }

  return [...new Set(
    value
      .split(',')
      .map(projectId => projectId.trim())
      .filter(projectId => /^prj_[A-Za-z0-9]+$/u.test(projectId))
  )]
}

export async function verifyShopifyPlatformAppOidc(
  request: Request
): Promise<boolean> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const projectIds = parseExpectedProjectIds(
    process.env.SHOPIFY_PLATFORM_APP_VERCEL_PROJECT_IDS
  )
  const ownerId =
    process.env.SHOPIFY_PLATFORM_APP_VERCEL_OWNER_ID

  if (
    !token
    || projectIds.length === 0
    || !ownerId
    || !/^team_[A-Za-z0-9]+$/u.test(ownerId)
  ) {
    return false
  }

  try {
    await verifyVercelOidcToken(token, {
      projectId: projectIds,
      ownerId,
      environment: 'production'
    })
    return true
  } catch {
    return false
  }
}
