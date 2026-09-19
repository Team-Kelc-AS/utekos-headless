import {
  authkit,
  handleAuthkitHeaders
} from '@workos-inc/authkit-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import { controlAuthConfig } from './controlAuthConfig'

export async function controlProxy(request: NextRequest) {
  const config = controlAuthConfig()
  if (!config.success)
    return NextResponse.json(
      { error: 'CONTROL_AUTH_UNAVAILABLE' },
      {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store' }
      }
    )
  const { headers } = await authkit(request, {
    redirectUri: config.data.NEXT_PUBLIC_WORKOS_REDIRECT_URI
  })
  const response = handleAuthkitHeaders(request, headers)
  if (response) {
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive'
    )
    response.headers.set('Referrer-Policy', 'no-referrer')
  }
  return response
}
