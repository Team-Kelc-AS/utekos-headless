import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePostgresConnectionUrl } from './resolvePostgresConnectionUrl'

test('prefers the transaction pooler for serverless runtime traffic', () => {
  assert.equal(
    resolvePostgresConnectionUrl({
      SUPABASE_VERCEL_POSTGRES_URL: 'transaction-pooler',
      SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING: 'session-pooler',
      SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING_MAYBE:
        'session-pooler-fallback'
    }),
    'transaction-pooler'
  )
})

test('falls back to the available session connection', () => {
  assert.equal(
    resolvePostgresConnectionUrl({
      SUPABASE_VERCEL_POSTGRES_URL: undefined,
      SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING: 'session-pooler',
      SUPABASE_VERCEL_POSTGRES_URL_NON_POOLING_MAYBE:
        'session-pooler-fallback'
    }),
    'session-pooler'
  )
})
