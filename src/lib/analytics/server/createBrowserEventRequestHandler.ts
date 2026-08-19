import { ZodError } from 'zod'
import type { CanonicalEventStore } from './canonicalEventStore'
import type { CanonicalBrowserEventRequestContext } from './normalizeCanonicalBrowserEvent'
import { redactPageUrlForLog } from './redactPageUrlForLog'

const MAX_BODY_BYTES = 32 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type AcceptResult =
  | { event_id: string; status: 'accepted' | 'duplicate' }
  | { reason: 'consent_denied'; status: 'rejected' }

type AcceptFn<TStore> = (input: {
  payload: unknown
  requestContext: CanonicalBrowserEventRequestContext
  store: TStore
}) => Promise<AcceptResult>

type HandlerOptions = {
  eventName?: string
}

function jsonResponse(body: Record<string, string>, status: number) {
  return Response.json(body, {
    headers: NO_STORE_HEADERS,
    status
  })
}

function hasJsonMediaType(request: Request) {
  return (
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() === 'application/json'
  )
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

function getEventSummary(payload: unknown) {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return {
      event_name: undefined,
      event_id: undefined,
      page_view_id: undefined,
      page_url: undefined
    }
  }

  const record = payload as Record<string, unknown>

  return {
    event_name:
      typeof record.event_name === 'string' ?
        record.event_name
      : undefined,
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
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length') ?? '0',
    origin: request.headers.get('origin'),
    ...fields
  }
}

export function createBrowserEventRequestHandler<
  TStore = CanonicalEventStore
>(
  accept: AcceptFn<TStore>,
  options: HandlerOptions = {}
) {
  const configuredEventName = options.eventName

  return async function handleRequest(
    request: Request,
    dependencies: {
      getRequestContext: (
        request: Request
      ) => CanonicalBrowserEventRequestContext
      store: TStore
    }
  ): Promise<Response> {
    if (!hasSameOrigin(request)) {
      console.warn(
        '[tracking] browser event rejected: bad origin',
        requestLogMeta(request, {
          event_name: configuredEventName
        })
      )
      return jsonResponse({ error: 'forbidden_origin' }, 403)
    }

    if (!hasJsonMediaType(request)) {
      console.warn(
        '[tracking] browser event rejected: non-json media type',
        requestLogMeta(request, {
          event_name: configuredEventName
        })
      )
      return jsonResponse({ error: 'unsupported_media_type' }, 415)
    }

    const declaredLength = Number(
      request.headers.get('content-length') ?? 0
    )
    if (declaredLength > MAX_BODY_BYTES) {
      console.warn(
        '[tracking] browser event rejected: payload too large',
        requestLogMeta(request, {
          event_name: configuredEventName,
          declared_length_bytes: declaredLength
        })
      )
      return jsonResponse({ error: 'payload_too_large' }, 413)
    }

    const body = await request.text()
    const bodyLength = new TextEncoder().encode(body).byteLength
    if (bodyLength > MAX_BODY_BYTES) {
      console.warn(
        '[tracking] browser event rejected: payload too large',
        requestLogMeta(request, {
          event_name: configuredEventName,
          body_length_bytes: bodyLength
        })
      )
      return jsonResponse({ error: 'payload_too_large' }, 413)
    }

    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch {
      console.warn(
        '[tracking] browser event rejected: invalid json',
        requestLogMeta(request, {
          event_name: configuredEventName,
          body_length_bytes: bodyLength
        })
      )
      return jsonResponse({ error: 'invalid_json' }, 400)
    }

    const summary = getEventSummary(payload)
    const eventName =
      configuredEventName ?? summary.event_name ?? 'unknown'

    try {
      const result = await accept({
        payload,
        requestContext: dependencies.getRequestContext(request),
        store: dependencies.store
      })

      if (result.status === 'rejected') {
        console.info(
          '[tracking] browser event rejected by consent',
          requestLogMeta(request, {
            event_name: eventName,
            event_id: summary.event_id,
            page_view_id: summary.page_view_id,
            page_url: summary.page_url,
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
        '[tracking] browser event completed',
        requestLogMeta(request, {
          event_name: eventName,
          event_id: result.event_id,
          page_view_id: summary.page_view_id,
          page_url: summary.page_url,
          status: result.status
        })
      )

      return jsonResponse(
        {
          event_id: result.event_id,
          status: result.status
        },
        result.status === 'accepted' ? 202 : 200
      )
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(
          '[tracking] browser event rejected: invalid_event',
          requestLogMeta(request, {
            event_name: eventName,
            event_id: summary.event_id,
            page_view_id: summary.page_view_id,
            page_url: summary.page_url,
            issue_count: error.issues.length
          })
        )
        return jsonResponse({ error: 'invalid_event' }, 400)
      }

      console.error(
        '[tracking] browser event failed',
        requestLogMeta(request, {
          event_name: eventName,
          event_id: summary.event_id,
          page_view_id: summary.page_view_id,
          page_url: summary.page_url
        }),
        error
      )
      return jsonResponse({ error: 'internal_error' }, 500)
    }
  }
}
