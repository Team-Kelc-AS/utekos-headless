const REQUEST_HEADERS_TO_REMOVE = [
  'authorization',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authorization',
  'proxy-authenticate',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-vercel-protection-bypass'
] as const

export function buildServerGtmRequestHeaders(request: Request) {
  const headers = new Headers(request.headers)
  const host = headers.get('host')

  for (const name of REQUEST_HEADERS_TO_REMOVE) {
    headers.delete(name)
  }

  headers.set('accept-encoding', 'identity')
  if (host) headers.set('x-forwarded-host', host)
  if (!headers.has('x-forwarded-proto')) {
    headers.set(
      'x-forwarded-proto',
      new URL(request.url).protocol.replace(':', '')
    )
  }

  return headers
}
