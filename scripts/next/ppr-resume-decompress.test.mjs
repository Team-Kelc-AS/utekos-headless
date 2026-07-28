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

test('decompressBody recovers gzip with a truncated trailer', () => {
  const plaintext = postponedState(64)
  const compressed = gzipSync(plaintext)
  const truncated = compressed.subarray(0, compressed.length - 8)

  assert.throws(() => gunzipSync(truncated), { code: 'Z_BUF_ERROR' })

  const result = decompressBody(truncated, undefined, 1024 * 1024)
  assert.equal(result.toString('utf8'), plaintext.toString('utf8'))
})

test('decompressBody recovers truncated gzip despite a mismatched header', () => {
  const plaintext = postponedState(48)
  const compressed = gzipSync(plaintext)
  const truncated = compressed.subarray(0, compressed.length - 8)

  assert.throws(() => gunzipSync(truncated), { code: 'Z_BUF_ERROR' })

  const result = decompressBody(truncated, 'deflate', 1024 * 1024)
  assert.equal(result.toString('utf8'), plaintext.toString('utf8'))
})

test('decompressBody ignores Content-Encoding when gzip magic is absent', () => {
  const body = postponedState(20)
  const result = decompressBody(body, 'gzip', 1024 * 1024)
  assert.equal(Buffer.compare(result, body), 0)
})

test('decompressBody fails soft for corrupt gzip bytes', () => {
  const body = Buffer.from([0x1f, 0x8b, 0x00, 0xff, 0x00])
  const result = decompressBody(body, 'gzip', 1024 * 1024)
  assert.equal(Buffer.compare(result, body), 0)
})
