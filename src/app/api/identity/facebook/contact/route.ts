import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FACEBOOK_LOGIN_IDENTITY_COOKIE,
  FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS
} from '@/lib/facebook-login/facebookLoginContracts'
import { readFacebookLoginIdentityCookie } from '@/lib/facebook-login/facebookLoginCookie'
import { readFacebookLoginConfig } from '@/lib/facebook-login/facebookLoginConfig'
import { encryptFacebookLoginJson } from '@/lib/facebook-login/facebookLoginCrypto'
import { protectFacebookLoginContact } from '@/lib/facebook-login/protectFacebookLoginContact'
import { updateFacebookLoginContact } from '@/lib/facebook-login/postgresFacebookLoginIdentityStore'

const contactSchema = z.strictObject({
  contact: z.string().trim().min(3).max(320)
})

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return Response.json(
      { error: 'forbidden_origin' },
      { headers: NO_STORE_HEADERS, status: 403 }
    )
  }

  try {
    const config = readFacebookLoginConfig()
    const identity = readFacebookLoginIdentityCookie({
      cookieHeader: request.headers.get('cookie') ?? undefined,
      identityKey: config.identityKey
    })
    if (!identity) {
      return Response.json(
        { error: 'facebook_login_session_missing' },
        { headers: NO_STORE_HEADERS, status: 401 }
      )
    }

    const body = contactSchema.parse(await request.json())
    const contact = protectFacebookLoginContact(
      body.contact,
      config.identityKey
    )

    await updateFacebookLoginContact({
      appId: config.appId,
      identityId: identity.identityId,
      ...(contact.kind === 'email' ?
        {
          emailCiphertext: contact.ciphertext,
          emailSha256: contact.sha256
        }
      : {
          phoneCiphertext: contact.ciphertext,
          phoneSha256: contact.sha256
        })
    })

    const expiresAt =
      Date.now() + FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS * 1000
    const cookie = encryptFacebookLoginJson(
      {
        ...identity,
        expiresAt,
        ...(contact.kind === 'email' ?
          { emailSha256: contact.sha256 }
        : { phoneSha256: contact.sha256 })
      },
      'identity-cookie',
      config.identityKey
    )
    const response = NextResponse.json(
      { status: 'connected' },
      { headers: NO_STORE_HEADERS }
    )

    response.cookies.set(
      FACEBOOK_LOGIN_IDENTITY_COOKIE,
      cookie,
      {
        httpOnly: true,
        maxAge: FACEBOOK_LOGIN_IDENTITY_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
        secure: request.nextUrl.protocol === 'https:'
      }
    )
    return response
  } catch (error) {
    const invalid =
      error instanceof z.ZodError ||
      (error instanceof Error &&
        error.message === 'facebook_login_contact_invalid')

    return Response.json(
      {
        error:
          invalid ?
            'facebook_login_contact_invalid'
          : 'facebook_login_contact_failed'
      },
      { headers: NO_STORE_HEADERS, status: invalid ? 400 : 500 }
    )
  }
}
