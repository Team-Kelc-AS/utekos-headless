import { connection, NextRequest } from 'next/server'
import { readFacebookLoginIdentityCookie } from '@/lib/facebook-login/facebookLoginCookie'
import { readFacebookLoginConfig } from '@/lib/facebook-login/facebookLoginConfig'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

export async function GET(request: NextRequest) {
  await connection()

  try {
    const config = readFacebookLoginConfig()
    const identity = readFacebookLoginIdentityCookie({
      cookieHeader: request.headers.get('cookie') ?? undefined,
      identityKey: config.identityKey
    })

    return Response.json(
      {
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
      { connected: false, needs_contact: false },
      { headers: NO_STORE_HEADERS }
    )
  }
}
