import { connection, NextRequest } from 'next/server'
import { readFacebookLoginIdentityCookie } from '@/lib/facebook-login/facebookLoginCookie'
import { readFacebookLoginRequestConfig } from '@/lib/facebook-login/readFacebookLoginRequestConfig'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

export async function GET(request: NextRequest) {
  await connection()

  try {
    const config = readFacebookLoginRequestConfig(request)
    const identity = readFacebookLoginIdentityCookie({
      cookieHeader: request.headers.get('cookie') ?? undefined,
      identityKey: config.identityKey
    })

    return Response.json(
      {
        linked: Boolean(identity),
        connected: Boolean(
          identity?.emailSha256 || identity?.phoneSha256
        ),
        needs_contact: Boolean(
          identity &&
          !identity.emailSha256 &&
          !identity.phoneSha256
        )
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch {
    return Response.json(
      { linked: false, connected: false, needs_contact: false },
      { headers: NO_STORE_HEADERS }
    )
  }
}
