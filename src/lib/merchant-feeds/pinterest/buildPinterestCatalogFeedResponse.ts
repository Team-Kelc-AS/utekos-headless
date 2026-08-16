import { createHash } from 'node:crypto'

import type { PinterestCatalogFeedDocument } from './buildPinterestCatalogFeed'

export function buildPinterestCatalogFeedResponse(
  feed: PinterestCatalogFeedDocument,
  ifNoneMatch: string | null
) {
  const digestHex = createHash('sha256')
    .update(feed.tsv)
    .digest('hex')
  const etag = `"${digestHex}"`
  const sharedHeaders = {
    'ETag': etag,
    'Last-Modified': feed.lastModified,
    'Cache-Control': 'public, max-age=900, must-revalidate',
    'X-Content-Type-Options': 'nosniff'
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
      'Content-Disposition':
        'inline; filename="pinterest-catalog.tsv"',
      ...sharedHeaders
    }
  }
}
