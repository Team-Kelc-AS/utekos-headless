import { connection } from 'next/server'

import { buildMetaCatalogFeedResponse } from '@/lib/merchant-feeds/meta/buildMetaCatalogFeedResponse'
import { getMetaCatalogFeed } from '@/lib/merchant-feeds/meta/getMetaCatalogFeed'

export async function GET(request: Request): Promise<Response> {
  await connection()

  try {
    const feed = await getMetaCatalogFeed()
    const response = buildMetaCatalogFeedResponse(
      feed,
      request.headers.get('if-none-match')
    )

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  } catch (error) {
    console.error('Failed to generate Meta catalog feed', error)

    return new Response('Unable to generate Meta catalog feed', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    })
  }
}
