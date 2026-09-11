const RESPONSE_HEADERS_TO_REMOVE = [
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
] as const

export function buildServerGtmResponseHeaders(
  upstreamHeaders: Headers
) {
  const headers = new Headers(upstreamHeaders)

  for (const name of RESPONSE_HEADERS_TO_REMOVE) {
    headers.delete(name)
  }

  headers.set('Cache-Control', 'no-store, max-age=0')
  headers.set('CDN-Cache-Control', 'no-store')
  headers.set('Vercel-CDN-Cache-Control', 'no-store')

  return headers
}
