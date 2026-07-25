import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  BaseExternalAccountClient,
  IdentityPoolClientOptions
} from 'google-auth-library'
import { JWT } from 'google-auth-library'
import {
  createGoogleDataManagerIngestionClient,
  readGoogleDataManagerAuthConfig,
  type GoogleDataManagerAuthDependencies,
  type GoogleDataManagerIngestionClient
} from './createGoogleDataManagerIngestionClient'

function ingestionClient(): GoogleDataManagerIngestionClient {
  return {
    ingestEvents: async () => [{}],
    retrieveRequestStatus: async () => [
      { requestStatusPerDestination: [] }
    ]
  }
}

test('uses local Application Default Credentials outside Vercel', () => {
  const localClient = ingestionClient()
  let externalAccountCount = 0
  let oidcTokenCount = 0

  const dependencies: GoogleDataManagerAuthDependencies = {
    createExternalAccountClient: () => {
      externalAccountCount += 1

      return {} as BaseExternalAccountClient
    },

    createIngestionClient: options => {
      assert.equal(options, undefined)

      return localClient
    },

    getOidcToken: async () => {
      oidcTokenCount += 1

      return 'unexpected'
    },

    readLocalServiceAccountCredentials: () => undefined
  }

  const client = createGoogleDataManagerIngestionClient(
    {},
    dependencies
  )

  assert.equal(client, localClient)
  assert.equal(externalAccountCount, 0)
  assert.equal(oidcTokenCount, 0)
})

test('preserves the local JSON service-account scope contract', () => {
  const localClient = ingestionClient()
  let ingestionOptions:
    | {
        authClient: BaseExternalAccountClient
        projectId: string
      }
    | undefined

  const dependencies: GoogleDataManagerAuthDependencies = {
    createExternalAccountClient: () => {
      throw new Error('unexpected external account construction')
    },
    createIngestionClient: options => {
      ingestionOptions = options

      return localClient
    },
    getOidcToken: async () => {
      throw new Error('unexpected OIDC token request')
    },
    readLocalServiceAccountCredentials: () => ({
      clientEmail:
        'local-data-manager@utekos-production.iam.gserviceaccount.com',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nfake-test-key\n-----END PRIVATE KEY-----',
      projectId: 'utekos-production'
    })
  }

  const client = createGoogleDataManagerIngestionClient(
    {},
    dependencies
  )

  assert.equal(client, localClient)
  assert.ok(ingestionOptions)
  assert.equal(ingestionOptions.projectId, 'utekos-production')

  const authClient =
    ingestionOptions.authClient as unknown as JWT

  assert.deepEqual(authClient.scopes, [
    'https://www.googleapis.com/auth/datamanager',
    'https://www.googleapis.com/auth/cloud-platform'
  ])
})

test('builds a scoped external account client on Vercel', async () => {
  const audience =
    '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel/providers/vercel'

  const externalAuthClient = {} as BaseExternalAccountClient

  const vercelClient = ingestionClient()

  let externalOptions: IdentityPoolClientOptions | undefined

  let ingestionOptions:
    | {
        authClient: BaseExternalAccountClient
        projectId: string
      }
    | undefined

  let oidcAudience: string | undefined

  const dependencies: GoogleDataManagerAuthDependencies = {
    createExternalAccountClient: options => {
      externalOptions = options

      return externalAuthClient
    },

    createIngestionClient: options => {
      ingestionOptions = options

      return vercelClient
    },

    getOidcToken: async options => {
      oidcAudience = options.audience

      return 'vercel-oidc-token'
    },

    readLocalServiceAccountCredentials: () => undefined
  }

  const client = createGoogleDataManagerIngestionClient(
    {
      GCP_AUDIENCE: audience,
      GCP_PROJECT_ID: 'utekos-production',
      GCP_SERVICE_ACCOUNT_EMAIL:
        'vercel-data-manager@utekos-production.iam.gserviceaccount.com',
      VERCEL: '1'
    },
    dependencies
  )

  assert.equal(client, vercelClient)

  assert.deepEqual(ingestionOptions, {
    authClient: externalAuthClient,
    projectId: 'utekos-production'
  })

  assert.ok(externalOptions)

  assert.equal(externalOptions.type, 'external_account')

  assert.equal(externalOptions.audience, audience)

  assert.equal(
    externalOptions.subject_token_type,
    'urn:ietf:params:oauth:token-type:jwt'
  )

  assert.equal(
    externalOptions.token_url,
    'https://sts.googleapis.com/v1/token'
  )

  assert.equal(
    externalOptions.service_account_impersonation_url,
    'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/vercel-data-manager@utekos-production.iam.gserviceaccount.com:generateAccessToken'
  )

  assert.deepEqual(externalOptions.scopes, [
    'https://www.googleapis.com/auth/datamanager',
    'https://www.googleapis.com/auth/cloud-platform'
  ])

  const supplier = externalOptions.subject_token_supplier

  assert.ok(supplier)

  assert.equal(
    await supplier.getSubjectToken(undefined as never),
    'vercel-oidc-token'
  )

  assert.equal(oidcAudience, audience)
})

test('rejects incomplete or unsafe Vercel auth configuration', () => {
  assert.throws(
    () => readGoogleDataManagerAuthConfig({ VERCEL: '1' }),
    /GCP_PROJECT_ID/
  )

  assert.throws(
    () =>
      readGoogleDataManagerAuthConfig({
        GCP_AUDIENCE:
          'https://iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/vercel',
        GCP_PROJECT_ID: 'utekos-production',
        GCP_SERVICE_ACCOUNT_EMAIL:
          'vercel-data-manager@utekos-production.iam.gserviceaccount.com',
        VERCEL: '1'
      }),
    /GCP_AUDIENCE/
  )

  assert.throws(
    () =>
      readGoogleDataManagerAuthConfig({
        GCP_AUDIENCE:
          '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/vercel',
        GCP_PROJECT_ID: 'utekos-production',
        GCP_SERVICE_ACCOUNT_EMAIL: 'not-a-service-account',
        VERCEL: '1'
      }),
    /GCP_SERVICE_ACCOUNT_EMAIL/
  )
})
