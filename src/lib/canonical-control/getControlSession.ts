import 'server-only'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { controlAuthConfig } from './controlAuthConfig'
import { isControlOperator } from './isControlOperator'

export async function getControlSession() {
  const config = controlAuthConfig()
  if (!config.success) return false
  const session = await withAuth()
  return isControlOperator(session, {
    userId: config.data.CANONICAL_CONTROL_USER_ID,
    organizationId: config.data.WORKOS_ORGANIZATION_ID
  })
}
