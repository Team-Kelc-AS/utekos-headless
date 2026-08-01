import { ZodError } from 'zod'
import {
  acceptCanonicalPageView,
  type CanonicalPageViewStore
} from './acceptCanonicalPageView'
import type {
  CanonicalPageViewRequestContext
} from './normalizeCanonicalPageView'
import { redactPageUrlForLog } from './redactPageUrlForLog'

const MAX_BODY_BYTES = 32 * 1024
const PRODUCTION_COOKIE_DOMAIN = 'utekos.no'
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type CanonicalPageViewRequestDependencies = {
  getRequestContext: (
    request: Request
  ) => CanonicalPageViewRequestContext
  store: CanonicalPageViewStore
}

function jsonResponse(
  body: Record<string, string>,
  status: number,
  cookiesToSet: Awaited<
    ReturnType<typeof acceptCanonicalPageView>
  >['cookiesToSet'] = [],
  pageUrl?: string
) {
  const response = Response.json(body, {
    headers: NO_STORE_HEADERS,
    status
  })

  if (cookiesToSet.length === 0 || !pageUrl) return response

  let hostname: string
  let secure: boolean
  try {
    const parsed = new URL(pageUrl)
    hostname = parsed.hostname
    secure = parsed.protocol === 'https:'
  } catch {
    return response
  }

  const domain =
    (
      hostname === PRODUCTION_COOKIE_DOMAIN ||
      hostname.endsWith(`.${PRODUCTION_COOKIE_DOMAIN}`)
    ) ?
      PRODUCTION_COOKIE_DOMAIN
    : undefined

  // Headers() on Response is immutable in some runtimes; rebuild.
  const headers = new Headers(response.headers)
  for (const cookie of cookiesToSet) {
    const parts = [
      `${cookie.name}=${cookie.value}`,
      'Path=/',
      `Max-Age=${cookie.maxAge}`,
      'SameSite=Lax'
    ]
    if (domain) parts.push(`Domain=${domain}`)
    if (secure) parts.push('Secure')
    headers.append('Set-Cookie', parts.join('; '))
  }

  return new Response(response.body, {
    headers,
    status: response.status
  })
}

function hasJsonMediaType(request: Request) {
  return request.headers
    .get('content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase() === 'application/json'
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function readPageUrl(payload: unknown) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return undefined
  }

  const pageUrl = (payload as { page_url?: unknown }).page_url
  return typeof pageUrl === 'string' ? pageUrl : undefined
}

function readEventSummary(payload: unknown) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return {
      event_id: undefined,
      page_view_id: undefined,
      page_url: undefined
    }
  }

  const record = payload as Record<string, unknown>

  return {
    event_id:
      typeof record.event_id === 'string' ?
        record.event_id
      : undefined,
    page_view_id:
      typeof record.page_view_id === 'string' ?
        record.page_view_id
      : undefined,
    page_url:
      typeof record.page_url === 'string' ?
        redactPageUrlForLog(record.page_url)
      : undefined
  }
}

function requestLogMeta(
  request: Request,
  fields: Record<string, unknown> = {}
) {
  return {
    path: new URL(request.url).pathname,
    method: request.method,
    origin: request.headers.get('origin'),
    ...fields
  }
}

export async function handleCanonicalPageViewRequest(
  request: Request,
  dependencies: CanonicalPageViewRequestDependencies
): Promise<Response> {
  if (!hasSameOrigin(request)) {
    console.warn(
      '[tracking] page_view request rejected: bad origin',
      requestLogMeta(request)
    )
    return jsonResponse({ error: 'forbidden_origin' }, 403)
  }

  if (!hasJsonMediaType(request)) {
    console.warn(
      '[tracking] page_view request rejected: non-json media type',
      requestLogMeta(request)
    )
    return jsonResponse({ error: 'unsupported_media_type' }, 415)
  }

  const declaredLength = Number(
    request.headers.get('content-length') ?? 0
  )
  if (declaredLength > MAX_BODY_BYTES) {
    console.warn(
      '[tracking] page_view request rejected: payload too large',
      requestLogMeta(request, {
        declared_length_bytes: declaredLength
      })
    )
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    console.warn(
      '[tracking] page_view request rejected: payload too large',
      requestLogMeta(request)
    )
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    console.warn(
      '[tracking] page_view request rejected: invalid json',
      requestLogMeta(request)
    )
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const summary = readEventSummary(payload)
  console.info(
    '[tracking] page_view request received',
    requestLogMeta(request, summary)
  )

  try {
    const result = await acceptCanonicalPageView({
      payload,
      requestContext: dependencies.getRequestContext(request),
      store: dependencies.store
    })

    if (result.status === 'rejected') {
      console.info(
        '[tracking] page_view request rejected by consent',
        requestLogMeta(request, {
          ...summary,
          status: result.status,
          reason: result.reason
        })
      )
      return new Response(null, {
        headers: NO_STORE_HEADERS,
        status: 204
      })
    }

    console.info(
      '[tracking] page_view request completed',
      requestLogMeta(request, {
        event_id: result.event_id,
        page_view_id: summary.page_view_id,
        page_url: summary.page_url,
        status: result.status,
        cookies_to_set: result.cookiesToSet.map(
          cookie => cookie.name
        )
      })
    )

    return jsonResponse(
      {
        event_id: result.event_id,
        status: result.status
      },
      result.status === 'accepted' ? 202 : 200,
      result.cookiesToSet,
      readPageUrl(payload)
    )
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(
        '[tracking] page_view request rejected: invalid_event',
        requestLogMeta(request, {
          ...summary,
          issue_count: error.issues.length
        })
      )
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    console.error(
      '[tracking] page_view request failed',
      requestLogMeta(request, summary),
      error
    )
    return jsonResponse({ error: 'internal_error' }, 500)
  }
}
