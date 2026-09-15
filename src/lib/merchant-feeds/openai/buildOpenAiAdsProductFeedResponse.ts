import { createHash } from 'node:crypto'

export function buildOpenAiAdsProductFeedResponse(
  csv: string,
  ifNoneMatch: string | null
) {
  const etag = `"${createHash('sha256').update(csv).digest('hex')}"`
  const sharedHeaders = {
    'ETag': etag,
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
    body: csv,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'inline; filename="utekos-openai-ads-products.csv"',
      ...sharedHeaders
    }
  }
}
