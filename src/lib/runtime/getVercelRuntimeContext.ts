import { getEnv } from '@vercel/functions'

export type VercelRuntimeContext = {
  environment: string
  region: string | null
  deploymentId: string | null
  commitSha: string | null
  isProductionDeployment: boolean
}

function nonEmpty(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function getVercelRuntimeContext(
  env: Record<string, string | undefined> = process.env
): VercelRuntimeContext {
  const {
    VERCEL_ENV,
    VERCEL_REGION,
    VERCEL_DEPLOYMENT_ID,
    VERCEL_GIT_COMMIT_SHA
  } = getEnv(env)

  const vercelEnvironment = nonEmpty(VERCEL_ENV)

  return {
    environment: vercelEnvironment ?? nonEmpty(env.NODE_ENV) ?? 'development',
    region: nonEmpty(VERCEL_REGION),
    deploymentId: nonEmpty(VERCEL_DEPLOYMENT_ID),
    commitSha: nonEmpty(VERCEL_GIT_COMMIT_SHA),
    isProductionDeployment: vercelEnvironment === 'production'
  }
}
