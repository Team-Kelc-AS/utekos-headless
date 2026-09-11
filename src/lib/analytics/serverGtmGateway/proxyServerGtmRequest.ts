import { buildServerGtmRequestHeaders } from './buildServerGtmRequestHeaders'
import { buildServerGtmResponseHeaders } from './buildServerGtmResponseHeaders'
import { buildServerGtmUpstreamUrl } from './buildServerGtmUpstreamUrl'

type ServerGtmRouteContext = {
  params: Promise<{ path?: string[] }>
}

const gatewayFailureHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store'
} satisfies HeadersInit

export async function proxyServerGtmRequest(
  request: Request,
  context: ServerGtmRouteContext,
  fetchImpl: typeof fetch = fetch
) {
  try {
    const { path } = await context.params
    const upstreamUrl = buildServerGtmUpstreamUrl(
      path,
      new URL(request.url).search
    )

    if (!upstreamUrl) {
      return new Response(null, {
        status: 400,
        headers: gatewayFailureHeaders
      })
    }

    const requestInit: RequestInit = {
      method: request.method,
      headers: buildServerGtmRequestHeaders(request),
      cache: 'no-store',
      redirect: 'manual'
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      requestInit.body = await request.arrayBuffer()
    }

    const upstreamResponse = await fetchImpl(
      upstreamUrl,
      requestInit
    )

    return new Response(
      request.method === 'HEAD' ? null : upstreamResponse.body,
      {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: buildServerGtmResponseHeaders(
          upstreamResponse.headers
        )
      }
    )
  } catch {
    return new Response(null, {
      status: 502,
      headers: gatewayFailureHeaders
    })
  }
}
