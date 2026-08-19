import assert from 'node:assert/strict'
import test from 'node:test'

import { readDrainRuntimeConfig } from './config.ts'

const baseEnvironment = new Map([
  ['VERCEL_FBCLID_HMAC_SECRET', 'fbclid-secret-at-least-32-characters'],
  ['VERCEL_LOG_DRAIN_ALLOWED_HOSTS', 'utekos.no,www.utekos.no'],
  ['VERCEL_LOG_DRAIN_ENVIRONMENT', 'production'],
  ['VERCEL_LOG_DRAIN_PROJECT_ID', 'prj_test'],
  [
    'VERCEL_LOG_DRAIN_SIGNATURE_SECRET',
    'drain-secret-that-is-at-least-32-characters'
  ]
])

function environment(values: Map<string, string>) {
  return { get: (name: string) => values.get(name) }
}

test('requires the dedicated transaction-pooler connection', () => {
  const values = new Map(baseEnvironment)
  values.set(
    'VERCEL_LOG_DRAIN_DATABASE_URL',
    'postgresql://postgres:secret@pooler.example.com:6543/postgres'
  )

  const config = readDrainRuntimeConfig(environment(values))

  assert.equal(
    config.databaseUrl,
    values.get('VERCEL_LOG_DRAIN_DATABASE_URL')
  )
})

test('does not fall back to the direct default database URL', () => {
  const values = new Map(baseEnvironment)
  values.set(
    'SUPABASE_DB_URL',
    'postgresql://postgres:secret@db.example.com:5432/postgres'
  )

  assert.throws(
    () => readDrainRuntimeConfig(environment(values)),
    /databaseUrl/u
  )
})

test('rejects session and direct database URLs', () => {
  for (const databaseUrl of [
    'postgresql://postgres:secret@pooler.example.com:5432/postgres',
    'postgresql://postgres:secret@db.example.com:5432/postgres'
  ]) {
    const values = new Map(baseEnvironment)
    values.set('VERCEL_LOG_DRAIN_DATABASE_URL', databaseUrl)

    assert.throws(
      () => readDrainRuntimeConfig(environment(values)),
      /transaction-pooler/u
    )
  }
})
