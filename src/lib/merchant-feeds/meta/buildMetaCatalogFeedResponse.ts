import { createHash } from 'node:crypto'

import type { MetaCatalogFeedDocument } from './buildMetaCatalogFeed'

export function buildMetaCatalogFeedResponse(
  feed: MetaCatalogFeedDocument,
  ifNoneMatch: string | null
) {
  const etag = `"${createHash('sha256').update(feed.tsv).digest('hex')}"`
  const sharedHeaders = {
    'ETag': etag,
    'Last-Modified': feed.lastModified,
    'Cache-Control': 'public, max-age=900, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Utekos-Catalog-Offer-Count': String(feed.offerCount)
  }

  if (ifNoneMatch === etag) {
    return {
      status: 304 as const,
      body: null,
      headers: sharedHeaders
    }
  }

  return {
    status: 200 as const,
    body: feed.tsv,
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Content-Disposition': 'inline; filename="meta-catalog.tsv"',
      ...sharedHeaders
    }
  }
}
