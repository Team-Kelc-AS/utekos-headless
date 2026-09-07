import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveAudienceRegistryCredentials } from './resolveAudienceRegistryCredentials'

test('registry uses the existing backend secret alias and never a public key', () => {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL:
      'https://hkoawfbomhnzupcsdggb.supabase.co',
    SUPABASE_VERCEL_SUPABASE_SECRET_KEY: 'backend-test-key',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key'
  }
  assert.equal(
    resolveAudienceRegistryCredentials(env).key,
    'backend-test-key'
  )
  assert.throws(() =>
    resolveAudienceRegistryCredentials({
      ...env,
      SUPABASE_VERCEL_SUPABASE_SECRET_KEY: undefined
    })
  )
  assert.throws(() =>
    resolveAudienceRegistryCredentials({
      ...env,
      NEXT_PUBLIC_SUPABASE_URL: 'https://other.supabase.co'
    })
  )
})
