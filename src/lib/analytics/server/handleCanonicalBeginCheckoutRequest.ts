import { ZodError } from 'zod'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import { readCheckoutMethod } from '../checkoutMethod'
import {
  acceptCanonicalBeginCheckout,
  type CanonicalBeginCheckoutStore
} from './acceptCanonicalBeginCheckout'
import { logCanonicalCommerceEvent } from '@/lib/observability/logging/logCanonicalCommerceEvent'
import type { CanonicalBeginCheckoutRequestContext } from './normalizeCanonicalBeginCheckout'

const MAX_BODY_BYTES = 32 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type CanonicalBeginCheckoutRequestDependencies = {
  getRequestContext: (
    request: Request
  ) => CanonicalBeginCheckoutRequestContext
  store: CanonicalBeginCheckoutStore
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

export async function handleCanonicalBeginCheckoutRequest(
  request: Request,
  dependencies: CanonicalBeginCheckoutRequestDependencies
): Promise<Response> {
  const startedAt = Date.now()

  if (!hasSameOrigin(request)) {
    return jsonResponse({ error: 'forbidden_origin' }, 403)
  }

  if (!hasJsonMediaType(request)) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415)
  }

  const declaredLength = Number(
    request.headers.get('content-length') ?? 0
  )
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  try {
    const result = await acceptCanonicalBeginCheckout({
      payload,
      requestContext: dependencies.getRequestContext(request),
      store: dependencies.store
    })

    if (result.status === 'rejected') {
      return new Response(null, {
        headers: NO_STORE_HEADERS,
        status: 204
      })
    }

    const event = canonicalBeginCheckoutSchema.safeParse(payload)
    if (event.success) {
      await logCanonicalCommerceEvent({
        checkoutMethod: readCheckoutMethod(request.headers),
        durationMs: Date.now() - startedAt,
        event: event.data,
        eventName: 'begin_checkout',
        request,
        status: result.status
      })
    }

    return jsonResponse(
      {
        event_id: result.event_id,
        status: result.status
      },
      result.status === 'accepted' ? 202 : 200
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    return jsonResponse({ error: 'internal_error' }, 500)
  }
}
