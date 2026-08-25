import 'server-only'

import type { NextRequest } from 'next/server'
import { readFacebookLoginConfig } from './facebookLoginConfig'

export function canUseDisabledFacebookLoginConfig(input: {
  hostname: string
  vercelEnvironment?: string | undefined
}) {
  const hostname = input.hostname.trim().toLowerCase()
  const local = ['localhost', '127.0.0.1', '::1'].includes(
    hostname
  )

  return (
    local ||
    (input.vercelEnvironment === 'preview' &&
      hostname.endsWith('.vercel.app'))
  )
}

export function readFacebookLoginRequestConfig(
  request: NextRequest
) {
  return readFacebookLoginConfig(process.env, {
    allowDisabled: canUseDisabledFacebookLoginConfig({
      hostname: request.nextUrl.hostname,
      vercelEnvironment: process.env.VERCEL_ENV
    })
  })
}
