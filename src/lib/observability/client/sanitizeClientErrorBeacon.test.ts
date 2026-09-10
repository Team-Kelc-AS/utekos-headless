import assert from 'node:assert/strict'
import test from 'node:test'
import {
  sanitizeClientErrorFilename,
  sanitizeClientErrorMessage
} from './sanitizeClientErrorBeacon'
test('only a coarse error class survives; no arbitrary message, click ID or customer content', () => {
  for (const value of [
    'boom customer@example.no failed',
    'fbclid=private',
    'Jane Doe 99999999',
    'x'.repeat(300)
  ]) {
    assert.equal(
      sanitizeClientErrorMessage(value),
      'ClientError'
    )
  }
  assert.equal(
    sanitizeClientErrorMessage(
      'TypeError: bad URL ?fbclid=secret'
    ),
    'TypeError'
  )
})
test('operational script path contains no filename or query', () => {
  assert.equal(
    sanitizeClientErrorFilename(
      'https://utekos.no/_next/static/chunks/app.js?dpl=secret'
    ),
    '/_next/:asset'
  )
})
