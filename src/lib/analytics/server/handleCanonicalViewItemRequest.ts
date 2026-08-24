import { ZodError } from 'zod'
import {
  acceptCanonicalViewItem,
  type CanonicalViewItemStore
} from './acceptCanonicalViewItem'
import { enrichCanonicalPayloadWithFacebookLogin } from '@/lib/facebook-login/enrichCanonicalPayloadWithFacebookLogin'
import type { CanonicalViewItemRequestContext } from './normalizeCanonicalViewItem'

const MAX_BODY_BYTES = 32 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

type CanonicalViewItemRequestDependencies = {
  getRequestContext: (
    request: Request
  ) => CanonicalViewItemRequestContext
  store: CanonicalViewItemStore
}

function jsonResponse(
  body: Record<string, string>,
  status: number
) {
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

export async function handleCanonicalViewItemRequest(
  request: Request,
  dependencies: CanonicalViewItemRequestDependencies
): Promise<Response> {
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
  if (
    new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES
  ) {
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }
  payload = enrichCanonicalPayloadWithFacebookLogin(
    payload,
    request.headers.get('cookie') ?? undefined
  )

  try {
    const result = await acceptCanonicalViewItem({
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

    return jsonResponse(
      { event_id: result.event_id, status: result.status },
      result.status === 'accepted' ? 202 : 200
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    return jsonResponse({ error: 'internal_error' }, 500)
  }
}
