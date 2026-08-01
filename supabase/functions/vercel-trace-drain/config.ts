import {
  traceDrainRuntimeConfigSchema,
  type TraceDrainRuntimeConfig
} from './contracts.ts'

interface EnvironmentReader {
  get(name: string): string | undefined
}

export function readTraceDrainRuntimeConfig(
  env: EnvironmentReader
): TraceDrainRuntimeConfig {
  return traceDrainRuntimeConfigSchema.parse({
    databaseUrl: env.get(
      'VERCEL_TRACE_DRAIN_DATABASE_URL'
    ),
    signatureSecret: env.get(
      'VERCEL_TRACE_DRAIN_SIGNATURE_SECRET'
    ),
    projectId: env.get('VERCEL_TRACE_DRAIN_PROJECT_ID'),
    environment: env.get('VERCEL_TRACE_DRAIN_ENVIRONMENT')
  })
}
