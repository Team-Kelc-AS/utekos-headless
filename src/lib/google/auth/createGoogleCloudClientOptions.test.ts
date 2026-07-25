import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  BaseExternalAccountClient,
  IdentityPoolClientOptions
} from 'google-auth-library'
import {
  createGoogleCloudClientOptions,
  readGoogleCloudAuthConfig,
  type GoogleCloudAuthDependencies
} from './createGoogleCloudClientOptions'

test('allows Google ADC outside Vercel', () => {
  let externalAccountCount = 0
  let oidcTokenCount = 0

  const dependencies: GoogleCloudAuthDependencies = {
    createExternalAccountClient: () => {
      externalAccountCount += 1

      return {} as BaseExternalAccountClient
    },
    getOidcToken: async () => {
      oidcTokenCount += 1

      return 'unexpected'
    }
  }

  assert.equal(
    createGoogleCloudClientOptions({}, dependencies),
    undefined
  )
  assert.equal(externalAccountCount, 0)
  assert.equal(oidcTokenCount, 0)
})

test('builds cloud-platform workload identity options on Vercel', async () => {
  const audience =
    '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel/providers/vercel'
  const externalAuthClient = {} as BaseExternalAccountClient
  let externalOptions: IdentityPoolClientOptions | undefined
  let oidcAudience: string | undefined

  const options = createGoogleCloudClientOptions(
    {
      GCP_AUDIENCE: audience,
      GCP_PROJECT_ID: 'utekos-production',
      GCP_SERVICE_ACCOUNT_EMAIL:
        'vercel-assistant@utekos-production.iam.gserviceaccount.com',
      VERCEL: '1'
    },
    {
      createExternalAccountClient: candidate => {
        externalOptions = candidate

        return externalAuthClient
      },
      getOidcToken: async candidate => {
        oidcAudience = candidate.audience

        return 'vercel-oidc-token'
      }
    }
  )

  assert.deepEqual(options, {
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
    'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/vercel-assistant@utekos-production.iam.gserviceaccount.com:generateAccessToken'
  )
  assert.deepEqual(externalOptions.scopes, [
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

test('uses an explicit provider scope policy on Vercel', () => {
  let externalOptions: IdentityPoolClientOptions | undefined

  createGoogleCloudClientOptions(
    {
      GCP_AUDIENCE:
        '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel/providers/vercel',
      GCP_PROJECT_ID: 'utekos-production',
      GCP_SERVICE_ACCOUNT_EMAIL:
        'vercel-data-manager@utekos-production.iam.gserviceaccount.com',
      VERCEL: '1'
    },
    {
      createExternalAccountClient: candidate => {
        externalOptions = candidate

        return {} as BaseExternalAccountClient
      },
      getOidcToken: async () => 'vercel-oidc-token'
    },
    {
      scopes: [
        'https://www.googleapis.com/auth/datamanager',
        'https://www.googleapis.com/auth/cloud-platform'
      ]
    }
  )

  assert.deepEqual(externalOptions?.scopes, [
    'https://www.googleapis.com/auth/datamanager',
    'https://www.googleapis.com/auth/cloud-platform'
  ])
})

test('rejects incomplete or unsafe Vercel auth configuration', () => {
  assert.throws(
    () => readGoogleCloudAuthConfig({ VERCEL: '1' }),
    /GCP_PROJECT_ID/
  )

  assert.throws(
    () =>
      readGoogleCloudAuthConfig({
        GCP_AUDIENCE:
          'https://iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/vercel',
        GCP_PROJECT_ID: 'utekos-production',
        GCP_SERVICE_ACCOUNT_EMAIL:
          'vercel-assistant@utekos-production.iam.gserviceaccount.com',
        VERCEL: '1'
      }),
    /GCP_AUDIENCE/
  )

  assert.throws(
    () =>
      readGoogleCloudAuthConfig({
        GCP_AUDIENCE:
          '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/vercel',
        GCP_PROJECT_ID: 'utekos-production',
        GCP_SERVICE_ACCOUNT_EMAIL: 'not-a-service-account',
        VERCEL: '1'
      }),
    /GCP_SERVICE_ACCOUNT_EMAIL/
  )
})

test('fails closed when Google cannot create an external account client', () => {
  assert.throws(
    () =>
      createGoogleCloudClientOptions(
        {
          GCP_AUDIENCE:
            '//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/vercel',
          GCP_PROJECT_ID: 'utekos-production',
          GCP_SERVICE_ACCOUNT_EMAIL:
            'vercel-assistant@utekos-production.iam.gserviceaccount.com',
          VERCEL: '1'
        },
        {
          createExternalAccountClient: () => null,
          getOidcToken: async () => 'vercel-oidc-token'
        }
      ),
    /Could not create Google external account client/
  )
})
