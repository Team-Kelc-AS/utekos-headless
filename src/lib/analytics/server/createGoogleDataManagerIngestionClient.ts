import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import {
  IngestionServiceClient,
  protos
} from '@google-ads/datamanager'
import { getVercelOidcToken } from '@vercel/oidc'
import {
  ExternalAccountClient,
  JWT,
  type BaseExternalAccountClient,
  type IdentityPoolClientOptions
} from 'google-auth-library'
import { z } from 'zod'
import {
  createGoogleCloudClientOptions,
  readGoogleCloudAuthConfig
} from '@/lib/google/auth/createGoogleCloudClientOptions'

const DATA_MANAGER_SCOPES = [
  'https://www.googleapis.com/auth/datamanager',
  'https://www.googleapis.com/auth/cloud-platform'
] as const

const LOCAL_DEV_DATA_MANAGER_SERVICE_ACCOUNT_PATH =
  'src/api/lib/cloud-credentials/tag-manager-credentials.json'

const localServiceAccountSchema = z.object({
  project_id: z.string().optional(),
  private_key: z.string().min(1),
  client_email: z.string().email()
})

type Environment = Readonly<Record<string, string | undefined>>

type LocalServiceAccountCredentials = {
  clientEmail: string
  privateKey: string
  projectId?: string
}

type LocalAdcConfig = { mode: 'local_adc' }

type LocalServiceAccountConfig = {
  mode: 'local_service_account'
} & LocalServiceAccountCredentials

type VercelOidcConfig = {
  audience: string
  mode: 'vercel_oidc'
  projectId: string
  serviceAccountEmail: string
}

export type GoogleDataManagerAuthConfig =
  | LocalAdcConfig
  | LocalServiceAccountConfig
  | VercelOidcConfig

type GoogleDataManagerCallOptions = { timeout: number }

export type GoogleDataManagerIngestionClient = {
  ingestEvents: (
    request: protos.google.ads.datamanager.v1.IIngestEventsRequest,
    options: GoogleDataManagerCallOptions
  ) => Promise<
    readonly [
      protos.google.ads.datamanager.v1.IIngestEventsResponse,
      ...unknown[]
    ]
  >
  retrieveRequestStatus: (
    request: protos.google.ads.datamanager.v1.IRetrieveRequestStatusRequest,
    options: GoogleDataManagerCallOptions
  ) => Promise<
    readonly [
      protos.google.ads.datamanager.v1.IRetrieveRequestStatusResponse,
      ...unknown[]
    ]
  >
}

type IngestionClientOptions = {
  authClient: BaseExternalAccountClient
  projectId: string
}

type OidcTokenOptions = { audience: string }

export type GoogleDataManagerAuthDependencies = {
  createExternalAccountClient: (
    options: IdentityPoolClientOptions
  ) => BaseExternalAccountClient | null
  createIngestionClient: (
    options?: IngestionClientOptions
  ) => GoogleDataManagerIngestionClient
  getOidcToken: (options: OidcTokenOptions) => Promise<string>
  readLocalServiceAccountCredentials: () =>
    | LocalServiceAccountCredentials
    | undefined
}

const defaultDependencies: GoogleDataManagerAuthDependencies = {
  createExternalAccountClient: options =>
    ExternalAccountClient.fromJSON(options),

  createIngestionClient: options => {
    if (!options) {
      return new IngestionServiceClient()
    }

    return new IngestionServiceClient({
      // google-gax og appen kan resolve ulike
      // patchversjoner av google-auth-library.
      // Runtime-kontrakten er AuthClient.
      authClient: options.authClient as never,
      projectId: options.projectId
    })
  },

  getOidcToken: getVercelOidcToken,

  readLocalServiceAccountCredentials:
    readLocalDevServiceAccountCredentials
}

function readLocalDevServiceAccountCredentials():
  | LocalServiceAccountCredentials
  | undefined {
  const credentialsPath = path.join(
    process.cwd(),
    LOCAL_DEV_DATA_MANAGER_SERVICE_ACCOUNT_PATH
  )

  if (!existsSync(credentialsPath)) {
    return undefined
  }

  const parsed = localServiceAccountSchema.safeParse(
    JSON.parse(readFileSync(credentialsPath, 'utf8'))
  )

  if (!parsed.success) {
    return undefined
  }

  return {
    clientEmail: parsed.data.client_email,
    privateKey: parsed.data.private_key.replace(/\\n/g, '\n'),
    ...(parsed.data.project_id ?
      { projectId: parsed.data.project_id }
    : {})
  }
}

export function readGoogleDataManagerAuthConfig(
  environment: Environment = process.env,
  dependencies: Pick<
    GoogleDataManagerAuthDependencies,
    'readLocalServiceAccountCredentials'
  > = defaultDependencies
): GoogleDataManagerAuthConfig {
  if (environment.VERCEL !== '1') {
    const serviceAccount =
      dependencies.readLocalServiceAccountCredentials()

    if (serviceAccount) {
      return { mode: 'local_service_account', ...serviceAccount }
    }

    return { mode: 'local_adc' }
  }

  const { audience, projectId, serviceAccountEmail } =
    readGoogleCloudAuthConfig(environment)

  return {
    audience,
    mode: 'vercel_oidc',
    projectId,
    serviceAccountEmail
  }
}

export function createGoogleDataManagerIngestionClient(
  environment: Environment = process.env,
  dependencies: GoogleDataManagerAuthDependencies = defaultDependencies
): GoogleDataManagerIngestionClient {
  const config = readGoogleDataManagerAuthConfig(
    environment,
    dependencies
  )

  if (config.mode === 'local_adc') {
    return dependencies.createIngestionClient()
  }

  if (config.mode === 'local_service_account') {
    const authClient = new JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: [...DATA_MANAGER_SCOPES]
    })

    return dependencies.createIngestionClient({
      authClient:
        authClient as unknown as BaseExternalAccountClient,
      projectId: config.projectId ?? ''
    })
  }

  const googleCloudOptions = createGoogleCloudClientOptions(
    environment,
    dependencies
  )

  if (!googleCloudOptions) {
    throw new Error(
      'Could not create Google Cloud client options on Vercel'
    )
  }

  return dependencies.createIngestionClient(googleCloudOptions)
}
