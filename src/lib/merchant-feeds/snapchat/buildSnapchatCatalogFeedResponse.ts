import { createHash } from 'node:crypto'

import type { SnapchatCatalogFeedDocument } from './buildSnapchatCatalogFeed'

export function buildSnapchatCatalogFeedResponse(
  feed: SnapchatCatalogFeedDocument,
  ifNoneMatch: string | null
) {
  const etag = `"${createHash('sha256').update(feed.tsv).digest('hex')}"`
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
        'inline; filename="snapchat-catalog.tsv"',
      ...sharedHeaders
    }
  }
}
