import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolveResendApiKey,
  resendApiKeyEnvNames
} from '@/lib/email/resolveResendApiKey'

test('prefers the Vercel Resend integration API key', () => {
  process.env.RESEND_HEADLESS_API_KEY_RESEND_API_KEY = 're_vercel'
  process.env.RESEND_API_KEY = 're_legacy'

  assert.equal(resolveResendApiKey(), 're_vercel')

  delete process.env.RESEND_HEADLESS_API_KEY_RESEND_API_KEY
  delete process.env.RESEND_API_KEY
})

test('falls back to legacy RESEND_API_KEY for local development', () => {
  process.env.RESEND_API_KEY = 're_legacy'

  assert.equal(resolveResendApiKey(), 're_legacy')

  delete process.env.RESEND_API_KEY
})

test('returns undefined when no Resend API key is configured', () => {
  delete process.env.RESEND_HEADLESS_API_KEY_RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  assert.equal(resolveResendApiKey(), undefined)
})

test('documents the supported env var names', () => {
  assert.deepEqual(resendApiKeyEnvNames, [
    'RESEND_HEADLESS_API_KEY_RESEND_API_KEY',
    'RESEND_API_KEY'
  ])
})
