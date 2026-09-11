import { z } from 'zod'

export function readMetaInsightsAccessToken(
  env: Record<string, string | undefined> = process.env
) {
  return z
    .string()
    .min(1)
    .parse(
      env.META_SYSTEM_USER_TOKEN ??
        env.META_ACCESS_TOKEN ??
        env.FACEBOOK_ACCESS_TOKEN
    )
}
