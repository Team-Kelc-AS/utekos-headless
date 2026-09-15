import { connection } from 'next/server'

import { buildOpenAiAdsProductFeedResponse } from '@/lib/merchant-feeds/openai/buildOpenAiAdsProductFeedResponse'
import { getOpenAiAdsProductFeed } from '@/lib/merchant-feeds/openai/getOpenAiAdsProductFeed'

export async function GET(request: Request): Promise<Response> {
  await connection()

  try {
    const csv = await getOpenAiAdsProductFeed()
    const response = buildOpenAiAdsProductFeedResponse(
      csv,
      request.headers.get('if-none-match')
    )

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  } catch (error) {
    console.error(
      'Failed to generate OpenAI Ads product feed',
      error
    )

    return new Response(
      'Unable to generate OpenAI Ads product feed',
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
