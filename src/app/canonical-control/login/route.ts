import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { NextResponse } from 'next/server'
import { controlAuthConfig } from '@/lib/canonical-control/controlAuthConfig'

export async function GET() {
  const config = controlAuthConfig()
  if (!config.success)
    return Response.json(
      { error: 'CONTROL_AUTH_UNAVAILABLE' },
      { status: 503 }
    )
  return NextResponse.redirect(
    await getSignInUrl({
      organizationId: config.data.WORKOS_ORGANIZATION_ID,
      redirectUri: config.data.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
      returnTo: '/canonical-control'
    })
  )
}
