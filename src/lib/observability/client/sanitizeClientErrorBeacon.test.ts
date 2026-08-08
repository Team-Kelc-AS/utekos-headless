import assert from 'node:assert/strict'
import test from 'node:test'

import {
  sanitizeClientErrorFilename,
  sanitizeClientErrorMessage
} from './sanitizeClientErrorBeacon'

test('redacts email-like tokens and truncates long messages', () => {
  assert.equal(
    sanitizeClientErrorMessage('boom customer@example.no failed'),
    'boom [redacted] failed'
  )
  assert.equal(
    sanitizeClientErrorMessage('x'.repeat(300)).length,
    240
  )
})

test('reduces script URLs to operational pathnames', () => {
  assert.equal(
    sanitizeClientErrorFilename(
      'https://utekos.no/_next/static/chunks/app.js?dpl=secret'
    ),
    '/_next/static/chunks/app.js'
  )
})
