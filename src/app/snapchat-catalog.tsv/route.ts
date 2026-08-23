import { connection } from 'next/server'

import { buildSnapchatCatalogFeedResponse } from '@/lib/merchant-feeds/snapchat/buildSnapchatCatalogFeedResponse'
import { getSnapchatCatalogFeed } from '@/lib/merchant-feeds/snapchat/getSnapchatCatalogFeed'

export async function GET(request: Request): Promise<Response> {
  await connection()

  try {
    const feed = await getSnapchatCatalogFeed()
    const response = buildSnapchatCatalogFeedResponse(
      feed,
      request.headers.get('if-none-match')
    )

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  } catch (error) {
    console.error(
      'Failed to generate Snapchat catalog feed',
      error
    )

    return new Response(
      'Unable to generate Snapchat catalog feed',
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
