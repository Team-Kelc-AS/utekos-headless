import { createHash } from 'node:crypto'

import { getKlarnaFeed } from '@/lib/merchant-feeds/klarna/getKlarnaFeed'
import { connection } from 'next/server'

function buildFeedHeaders(
  feed: string,
  lastModified: string,
  ifNoneMatch: string | null
) {
  const digestHex = createHash('sha256')
    .update(feed)
    .digest('hex')
  const etag = `"${digestHex}"`

  if (ifNoneMatch === etag) {
    return {
      status: 304 as const,
      body: null,
      headers: {
        'ETag': etag,
        'Last-Modified': lastModified,
        'Cache-Control': 'public, max-age=900, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    }
  }

  return {
    status: 200 as const,
    body: feed,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': 'public, max-age=900, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    }
  }
}

export async function GET(request: Request): Promise<Response> {
  await connection()

  try {
    const feed = await getKlarnaFeed()
    const response = buildFeedHeaders(
      feed.xml,
      feed.lastModified,
      request.headers.get('if-none-match')
    )

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  } catch (error) {
    console.error('Failed to generate Klarna feed', error)

    return new Response('Unable to generate Klarna feed', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    })
  }
}
