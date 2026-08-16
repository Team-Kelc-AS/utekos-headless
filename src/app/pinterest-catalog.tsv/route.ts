import { connection } from 'next/server'

import { buildPinterestCatalogFeedResponse } from '@/lib/merchant-feeds/pinterest/buildPinterestCatalogFeedResponse'
import { getPinterestCatalogFeed } from '@/lib/merchant-feeds/pinterest/getPinterestCatalogFeed'

export async function GET(request: Request): Promise<Response> {
  await connection()

  try {
    const feed = await getPinterestCatalogFeed()
    const response = buildPinterestCatalogFeedResponse(
      feed,
      request.headers.get('if-none-match')
    )

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  } catch (error) {
    console.error(
      'Failed to generate Pinterest catalog feed',
      error
    )

    return new Response(
      'Unable to generate Pinterest catalog feed',
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}
