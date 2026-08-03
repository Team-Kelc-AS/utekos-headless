import { ZodError } from 'zod'
import { canonicalAddToCartSchema } from '../addToCartEvent'
import {
  acceptCanonicalAddToCart,
  type CanonicalAddToCartStore
} from './acceptCanonicalAddToCart'
import { logCanonicalCommerceEvent } from '@/lib/observability/logging/logCanonicalCommerceEvent'
import type { CanonicalAddToCartRequestContext } from './normalizeCanonicalAddToCart'

const MAX_BODY_BYTES = 32 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type CanonicalAddToCartRequestDependencies = {
  getRequestContext: (
    request: Request
  ) => CanonicalAddToCartRequestContext
  store: CanonicalAddToCartStore
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

export async function handleCanonicalAddToCartRequest(
  request: Request,
  dependencies: CanonicalAddToCartRequestDependencies
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
    const result = await acceptCanonicalAddToCart({
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

    const event = canonicalAddToCartSchema.safeParse(payload)
    if (event.success) {
      await logCanonicalCommerceEvent({
        durationMs: Date.now() - startedAt,
        event: event.data,
        eventName: 'add_to_cart',
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
