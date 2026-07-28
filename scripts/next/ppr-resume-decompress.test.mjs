import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { gunzipSync, gzipSync } from 'node:zlib'
import test from 'node:test'

const require = createRequire(import.meta.url)
const {
  decompressBody
} = require('next/dist/server/lib/postponed-request-body.js')

function postponedState(length = 12) {
  const payload = 'x'.repeat(length)
  return Buffer.from(`${length}:${payload}null`, 'utf8')
}

test('decompressBody returns uncompressed postponed state unchanged', () => {
  const body = postponedState()
  const result = decompressBody(body, undefined, 1024 * 1024)
  assert.equal(Buffer.compare(result, body), 0)
})

test('decompressBody gunzips complete bodies with gzip magic and no header', () => {
  const plaintext = postponedState(24)
  const compressed = gzipSync(plaintext)
  const result = decompressBody(compressed, undefined, 1024 * 1024)
  assert.equal(result.toString('utf8'), plaintext.toString('utf8'))
})

test('decompressBody gunzips complete bodies with Content-Encoding gzip', () => {
  const plaintext = postponedState(18)
  const compressed = gzipSync(plaintext)
  const result = decompressBody(compressed, 'gzip', 1024 * 1024)
  assert.equal(result.toString('utf8'), plaintext.toString('utf8'))
})

test('decompressBody does not throw on truncated gzip and returns raw body', () => {
  const plaintext = postponedState(64)
  const compressed = gzipSync(plaintext)
  const truncated = compressed.subarray(0, Math.max(8, compressed.length - 12))

  assert.throws(() => gunzipSync(truncated), { code: 'Z_BUF_ERROR' })

  const result = decompressBody(truncated, undefined, 1024 * 1024)
  assert.equal(Buffer.compare(result, truncated), 0)
})

test('decompressBody does not throw on truncated gzip with Content-Encoding', () => {
  const plaintext = postponedState(48)
  const compressed = gzipSync(plaintext)
  const truncated = compressed.subarray(0, Math.max(8, compressed.length - 20))

  assert.throws(() => gunzipSync(truncated), { code: 'Z_BUF_ERROR' })

  const result = decompressBody(truncated, 'gzip', 1024 * 1024)
  assert.equal(Buffer.compare(result, truncated), 0)
})

test('decompressBody ignores Content-Encoding when gzip magic is absent', () => {
  const body = postponedState(20)
  const result = decompressBody(body, 'gzip', 1024 * 1024)
  assert.equal(Buffer.compare(result, body), 0)
})
