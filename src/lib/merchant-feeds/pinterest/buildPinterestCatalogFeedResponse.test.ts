import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPinterestCatalogFeedResponse } from './buildPinterestCatalogFeedResponse'

test('uses the Shopify catalog timestamp as Last-Modified', () => {
  const response = buildPinterestCatalogFeedResponse(
    {
      tsv: 'id\ttitle\r\n',
      lastModified: 'Sat, 15 Aug 2026 10:00:00 GMT'
    },
    null
  )

  assert.equal(response.status, 200)
  assert.equal(
    response.headers['Last-Modified'],
    'Sat, 15 Aug 2026 10:00:00 GMT'
  )
  assert.equal(
    response.headers['Content-Type'],
    'text/tab-separated-values; charset=utf-8'
  )
})

test('returns 304 when the caller already has the current ETag', () => {
  const fresh = buildPinterestCatalogFeedResponse(
    {
      tsv: 'id\ttitle\r\n',
      lastModified: 'Sat, 15 Aug 2026 10:00:00 GMT'
    },
    null
  )
  const cached = buildPinterestCatalogFeedResponse(
    {
      tsv: 'id\ttitle\r\n',
      lastModified: 'Sat, 15 Aug 2026 10:00:00 GMT'
    },
    fresh.headers.ETag
  )

  assert.equal(cached.status, 304)
  assert.equal(cached.body, null)
})
