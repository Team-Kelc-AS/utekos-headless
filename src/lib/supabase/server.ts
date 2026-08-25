import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  verifyCredentials,
  createContextClient,
  createAdminClient
} from '@supabase/server/core'
import type {
  AuthModeWithKey,
  SupabaseContext,
  SupabaseEnv
} from '@supabase/server'

import type {
  Database
} from '@/types/supabase/database.types'

function resolveNextEnv(): Partial<SupabaseEnv> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL
    || process.env.SUPABASE_URL
    || process.env.SUPABASE_VERCEL_SUPABASE_URL

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_VERCEL_SUPABASE_ANON_KEY

  const secretKey =
    process.env
      .SUPABASE_VERCEL_SUPABASE_SECRET_KEY
    || process.env
      .SUPABASE_VERCEL_SUPABASE_SERVICE_ROLE_KEY

  const env: Partial<SupabaseEnv> = {
    publishableKeys:
      publishableKey
        ? {
            default: publishableKey
          }
        : {},

    secretKeys:
      secretKey
        ? {
            default: secretKey
          }
        : {}
  }

  if (url) {
    env.url = url
  }

  return env
}

/**
 * Dedicated privileged server client.
 *
 * This path deliberately does not inspect Next.js cookies,
 * user sessions or browser credentials.
 *
 * The generic allows narrowly typed database extensions for
 * migrations that exist in source control before generated
 * database.types.ts has been refreshed.
 */
export function createSupabaseAdminClient<
  TDatabase = Database
>() {
  const env =
    resolveNextEnv()

  if (!env.url) {
    throw new Error(
      'supabase_admin_url_missing'
    )
  }

  if (!env.secretKeys?.default) {
    throw new Error(
      'supabase_admin_secret_missing'
    )
  }

  return createAdminClient<TDatabase>({
    env
  })
}

let cachedJwks:
  SupabaseEnv['jwks'] = null

async function getJwks(
  supabaseUrl: string
): Promise<SupabaseEnv['jwks']> {
  if (cachedJwks) {
    return cachedJwks
  }

  try {
    const response =
      await fetch(
        `${supabaseUrl}/auth/v1/.well-known/jwks.json`
      )

    if (!response.ok) {
      return null
    }

    cachedJwks =
      await response.json()

    return cachedJwks
  } catch {
    return null
  }
}

export async function createSupabaseContext(
  options: {
    auth?:
      | AuthModeWithKey
      | AuthModeWithKey[]
  } = {
    auth: 'user'
  }
): Promise<
  | {
      data: SupabaseContext<Database>
      error: null
    }
  | {
      data: null
      error: Error
    }
> {
  const nextEnv =
    resolveNextEnv()

  if (
    !nextEnv.url
    || !nextEnv.publishableKeys?.default
  ) {
    return {
      data: null,
      error: new Error(
        'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY'
      )
    }
  }

  const cookieStore =
    await cookies()

  const ssrClient =
    createServerClient(
      nextEnv.url,
      nextEnv.publishableKeys.default,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },

          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(
                ({
                  name,
                  value,
                  options: cookieOptions
                }) => {
                  cookieStore.set(
                    name,
                    value,
                    cookieOptions
                  )
                }
              )
            } catch {
              /**
               * Server Components cannot persist
               * refreshed cookies.
               *
               * Middleware owns that responsibility.
               */
            }
          }
        }
      }
    )

  const {
    data: {
      session
    }
  } =
    await ssrClient.auth.getSession()

  const token =
    session?.access_token
    ?? null

  const jwks =
    await getJwks(
      nextEnv.url
    )

  const env:
    Partial<SupabaseEnv> = {
      ...nextEnv,
      jwks
    }

  const {
    data: auth,
    error
  } =
    await verifyCredentials(
      {
        token,
        apikey: null
      },
      {
        auth:
          options.auth
          ?? 'user',
        env
      }
    )

  if (error) {
    return {
      data: null,
      error
    }
  }

  const supabase =
    createContextClient<Database>({
      auth: {
        token:
          auth!.token
      },
      env
    })

  const supabaseAdmin =
    createAdminClient<Database>({
      env
    })

  return {
    data: {
      supabase,
      supabaseAdmin,
      userClaims:
        auth!.userClaims,
      jwtClaims:
        auth!.jwtClaims,
      authMode:
        auth!.authMode
    },
    error: null
  }
}