import { z } from 'zod'

const schema = z.object({
  WORKOS_CLIENT_ID: z.string().startsWith('client_'),
  WORKOS_API_KEY: z.string().min(1),
  WORKOS_COOKIE_PASSWORD: z.string().min(32),
  WORKOS_COOKIE_NAME: z.literal('__Host-canonical-control'),
  WORKOS_COOKIE_MAX_AGE: z.literal('3600'),
  WORKOS_COOKIE_DOMAIN: z.literal('').optional(),
  WORKOS_ORGANIZATION_ID: z.string().startsWith('org_'),
  CANONICAL_CONTROL_USER_ID: z.string().startsWith('user_'),
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: z.literal(
    'https://utekos.no/canonical-control/callback'
  )
})

export function controlAuthConfig(
  environment: Record<string, string | undefined> = process.env
) {
  return schema.safeParse(environment)
}
