import assert from 'node:assert/strict'
import test from 'node:test'

import { buildOpenAiAdsProductFeedResponse } from './buildOpenAiAdsProductFeedResponse'

test('returns a stable downloadable CSV response with conditional ETag support', () => {
  const first = buildOpenAiAdsProductFeedResponse(
    'item_id\r\n1\r\n',
    null
  )

  assert.equal(first.status, 200)
  assert.equal(
    first.headers['Content-Type'],
    'text/csv; charset=utf-8'
  )
  assert.equal(
    first.headers['Content-Disposition'],
    'inline; filename="utekos-openai-ads-products.csv"'
  )
  assert.match(first.headers.ETag, /^"[a-f0-9]{64}"$/)

  const repeated = buildOpenAiAdsProductFeedResponse(
    'item_id\r\n1\r\n',
    first.headers.ETag
  )
  assert.equal(repeated.status, 304)
  assert.equal(repeated.body, null)
})
