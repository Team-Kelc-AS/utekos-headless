import assert from 'node:assert/strict'
import test from 'node:test'

import { buildSnapchatCatalogFeedResponse } from './buildSnapchatCatalogFeedResponse'

test('serves a Snapchat TSV with validators and no sniffing', () => {
  const response = buildSnapchatCatalogFeedResponse(
    {
      tsv: 'id\ttitle\r\n',
      lastModified: 'Sun, 23 Aug 2026 09:00:00 GMT'
    },
    null
  )

  assert.equal(response.status, 200)
  assert.equal(
    response.headers['Content-Type'],
    'text/tab-separated-values; charset=utf-8'
  )
  assert.equal(
    response.headers['Content-Disposition'],
    'inline; filename="snapchat-catalog.tsv"'
  )
  assert.equal(response.headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(
    response.headers['Last-Modified'],
    'Sun, 23 Aug 2026 09:00:00 GMT'
  )
})

test('returns 304 for the current Snapchat feed ETag', () => {
  const feed = {
    tsv: 'id\ttitle\r\n',
    lastModified: 'Sun, 23 Aug 2026 09:00:00 GMT'
  }
  const fresh = buildSnapchatCatalogFeedResponse(feed, null)
  const cached = buildSnapchatCatalogFeedResponse(
    feed,
    fresh.headers.ETag
  )

  assert.equal(cached.status, 304)
  assert.equal(cached.body, null)
})
