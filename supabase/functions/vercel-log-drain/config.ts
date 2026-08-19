import {
  drainRuntimeConfigSchema,
  type DrainRuntimeConfig
} from './contracts.ts'

interface EnvironmentReader {
  get(name: string): string | undefined
}

export function readDrainRuntimeConfig(
  env: EnvironmentReader
): DrainRuntimeConfig {
  const allowedHosts = (
    env.get('VERCEL_LOG_DRAIN_ALLOWED_HOSTS') ?? ''
  )
    .split(',')
    .map(host => host.trim())
    .filter(Boolean)
  return drainRuntimeConfigSchema.parse({
    databaseUrl: env.get('VERCEL_LOG_DRAIN_DATABASE_URL'),
    signatureSecret: env.get(
      'VERCEL_LOG_DRAIN_SIGNATURE_SECRET'
    ),
    projectId: env.get('VERCEL_LOG_DRAIN_PROJECT_ID'),
    environment: env.get('VERCEL_LOG_DRAIN_ENVIRONMENT'),
    allowedHosts,
    fbclidHmacSecret: env.get('VERCEL_FBCLID_HMAC_SECRET')
  })
}
