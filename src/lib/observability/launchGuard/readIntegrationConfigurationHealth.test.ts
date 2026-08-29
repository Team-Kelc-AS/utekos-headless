import assert from 'node:assert/strict'
import test from 'node:test'
import {
  INTEGRATION_CONFIGURATION_SURFACES,
  readIntegrationConfigurationHealth
} from './readIntegrationConfigurationHealth'

const runId = '11111111-1111-4111-8111-111111111111'
const now = () => new Date('2026-08-29T12:00:00.000Z')

test('covers the launch integration matrix without persisting secret values', () => {
  const snapshots = readIntegrationConfigurationHealth({
    environment: {
      META_ACCESS_TOKEN: 'must-never-appear',
      META_PIXEL_ID: '123',
      SUPABASE_VERCEL_POSTGRES_URL: 'postgres://must-never-appear'
    },
    now,
    runId
  })

  assert.equal(
    snapshots.length,
    INTEGRATION_CONFIGURATION_SURFACES.length
  )
  assert.ok(
    [
      'sentry',
      'ga4',
      'google_data_manager',
      'meta',
      'microsoft',
      'pinterest',
      'snapchat',
      'shopify',
      'supabase',
      'twilio',
      'customer_assistant',
      'clarity',
      'signals_gateway'
    ].every(integration =>
      snapshots.some(snapshot => snapshot.integration === integration)
    )
  )

  const serialized = JSON.stringify(snapshots)
  assert.doesNotMatch(serialized, /must-never-appear/)
  assert.equal(
    snapshots.find(snapshot => snapshot.integration === 'meta')?.status,
    'healthy'
  )
  assert.equal(
    snapshots.find(snapshot => snapshot.integration === 'twilio')?.status,
    'not_configured'
  )
  assert.equal(
    snapshots.find(
      snapshot => snapshot.integration === 'customer_assistant'
    )?.resultCode,
    'integration_explicitly_disabled'
  )
})

test('mirrors the actual GA4, Data Manager and private Storefront runtime contracts', () => {
  const snapshots = readIntegrationConfigurationHealth({
    environment: {
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'G-TEST',
      GOOGLE_ANALYTICS_PROPERTY_ID: '123',
      GCP_PROJECT_ID: 'utekos-production',
      GCP_SERVICE_ACCOUNT_EMAIL: 'service@example.invalid',
      GCP_AUDIENCE: '//iam.googleapis.com/example',
      VERCEL_SHOPIFY_STORE_DOMAIN: 'shop.example',
      STOREFRONT_PRIVATE_ACCESS_TOKEN: 'private-token'
    },
    now,
    runId
  })

  for (const integration of [
    'ga4',
    'google_data_manager',
    'shopify'
  ]) {
    assert.equal(
      snapshots.find(snapshot => snapshot.integration === integration)
        ?.status,
      'healthy'
    )
  }
})
