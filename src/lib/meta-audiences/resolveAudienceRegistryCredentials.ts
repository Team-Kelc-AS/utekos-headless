import { z } from 'zod'

export function resolveAudienceRegistryCredentials(
  env: Record<string, string | undefined> = process.env
) {
  const url = z
    .literal('https://hkoawfbomhnzupcsdggb.supabase.co')
    .parse(env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL)
  const key = z
    .string()
    .min(1)
    .parse(
      env.SUPABASE_VERCEL_SUPABASE_SECRET_KEY ||
        env.SUPABASE_SECRET_KEY ||
        env.SUPABASE_VERCEL_SUPABASE_SERVICE_ROLE_KEY ||
        env.SUPABASE_SERVICE_ROLE_KEY
    )
  return { url, key }
}
