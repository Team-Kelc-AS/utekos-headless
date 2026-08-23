import assert from 'node:assert/strict'
import test from 'node:test'

import { buildMetaCatalogFeedResponse } from './buildMetaCatalogFeedResponse'

const feed = {
  lastModified: 'Sun, 23 Aug 2026 10:00:00 GMT',
  offerCount: 12,
  tsv: 'id\ttitle\r\n1\tUtekos\r\n'
}

test('returns a cacheable Meta TSV with an offer count', () => {
  const response = buildMetaCatalogFeedResponse(feed, null)

  assert.equal(response.status, 200)
  assert.equal(response.body, feed.tsv)
  assert.equal(
    response.headers['Content-Type'],
    'text/tab-separated-values; charset=utf-8'
  )
  assert.equal(
    response.headers['X-Utekos-Catalog-Offer-Count'],
    '12'
  )
  assert.match(response.headers.ETag, /^"[a-f0-9]{64}"$/)
})

test('returns 304 for an unchanged feed', () => {
  const first = buildMetaCatalogFeedResponse(feed, null)
  const response = buildMetaCatalogFeedResponse(
    feed,
    first.headers.ETag
  )

  assert.equal(response.status, 304)
  assert.equal(response.body, null)
})
