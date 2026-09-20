import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldCollectMetaClientIp } from './shouldCollectMetaClientIp'

test('skips Meta client IP on local development hosts', () => {
  assert.equal(
    shouldCollectMetaClientIp(
      'http://localhost:3000/skreddersy-varmen',
      'development'
    ),
    false
  )
  assert.equal(
    shouldCollectMetaClientIp('http://127.0.0.1:3000/', 'production'),
    false
  )
  assert.equal(
    shouldCollectMetaClientIp('http://[::1]:3000/', 'development'),
    false
  )
})

test('collects Meta client IP only on Vercel production and preview', () => {
  assert.equal(
    shouldCollectMetaClientIp('https://utekos.no/produkter', 'production'),
    true
  )
  assert.equal(
    shouldCollectMetaClientIp(
      'https://utekos-headless.vercel.app/',
      'production'
    ),
    true
  )
})
