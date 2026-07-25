import { getVercelOidcToken } from '@vercel/oidc'
import {
  ExternalAccountClient,
  type BaseExternalAccountClient,
  type IdentityPoolClientOptions
} from 'google-auth-library'

const CLOUD_PLATFORM_SCOPE =
  'https://www.googleapis.com/auth/cloud-platform'

type Environment = Readonly<Record<string, string | undefined>>

type OidcTokenOptions = { audience: string }

export type GoogleCloudAuthConfig = {
  audience: string
  projectId: string
  serviceAccountEmail: string
}

export type GoogleCloudAuthDependencies = {
  createExternalAccountClient: (
    options: IdentityPoolClientOptions
  ) => BaseExternalAccountClient | null
  getOidcToken: (options: OidcTokenOptions) => Promise<string>
}

export type GoogleCloudClientOptions = {
  authClient: BaseExternalAccountClient
  projectId: string
}

export type GoogleCloudScopePolicy = {
  scopes: readonly string[]
}

const defaultScopePolicy: GoogleCloudScopePolicy = {
  scopes: [CLOUD_PLATFORM_SCOPE]
}

const defaultDependencies: GoogleCloudAuthDependencies = {
  createExternalAccountClient: options =>
    ExternalAccountClient.fromJSON(options),
  getOidcToken: getVercelOidcToken
}

function requiredEnvironmentValue(
  environment: Environment,
  name: string
) {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing required Google Cloud auth configuration: ${name}`
    )
  }

  return value
}

export function readGoogleCloudAuthConfig(
  environment: Environment = process.env
): GoogleCloudAuthConfig {
  const projectId = requiredEnvironmentValue(
    environment,
    'GCP_PROJECT_ID'
  )
  const serviceAccountEmail = requiredEnvironmentValue(
    environment,
    'GCP_SERVICE_ACCOUNT_EMAIL'
  )
  const audience = requiredEnvironmentValue(
    environment,
    'GCP_AUDIENCE'
  )

  if (
    !/^\/\/iam\.googleapis\.com\/projects\/\d+\/locations\/global\/workloadIdentityPools\/[A-Za-z0-9._-]+\/providers\/[A-Za-z0-9._-]+$/.test(
      audience
    )
  ) {
    throw new Error(
      'GCP_AUDIENCE must be a canonical Google Workload Identity provider resource name'
    )
  }

  if (
    !/^[A-Za-z0-9._-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(
      serviceAccountEmail
    )
  ) {
    throw new Error(
      'GCP_SERVICE_ACCOUNT_EMAIL must be a Google service account email'
    )
  }

  return { audience, projectId, serviceAccountEmail }
}

export function createGoogleCloudClientOptions(
  environment: Environment = process.env,
  dependencies: GoogleCloudAuthDependencies = defaultDependencies,
  scopePolicy: GoogleCloudScopePolicy = defaultScopePolicy
): GoogleCloudClientOptions | undefined {
  if (environment.VERCEL !== '1') return undefined

  const config = readGoogleCloudAuthConfig(environment)
  const authClient = dependencies.createExternalAccountClient({
    type: 'external_account',
    audience: config.audience,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${config.serviceAccountEmail}:generateAccessToken`,
    scopes: [...scopePolicy.scopes],
    subject_token_supplier: {
      getSubjectToken: () =>
        dependencies.getOidcToken({ audience: config.audience })
    }
  })

  if (!authClient) {
    throw new Error(
      'Could not create Google external account client'
    )
  }

  return { authClient, projectId: config.projectId }
}
