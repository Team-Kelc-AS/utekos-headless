import { ZodError } from 'zod'
import { provisionalPageViewCaptureSchema } from '../provisionalPageViewCapture'
import type { ProvisionalPageViewCaptureStore } from './provisionalPageViewCaptureStore'
import { redactPageUrlForLog } from './redactPageUrlForLog'

const MAX_BODY_BYTES = 32 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
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

export async function handleProvisionalPageViewCaptureRequest(
  request: Request,
  store: ProvisionalPageViewCaptureStore
) {
  if (!hasSameOrigin(request)) {
    return Response.json(
      { error: 'forbidden_origin' },
      { headers: NO_STORE_HEADERS, status: 403 }
    )
  }

  if (!hasJsonMediaType(request)) {
    return Response.json(
      { error: 'unsupported_media_type' },
      { headers: NO_STORE_HEADERS, status: 415 }
    )
  }

  const declaredLength = Number(
    request.headers.get('content-length') ?? 0
  )
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: 'payload_too_large' },
      { headers: NO_STORE_HEADERS, status: 413 }
    )
  }

  const body = await request.text()
  if (
    new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES
  ) {
    return Response.json(
      { error: 'payload_too_large' },
      { headers: NO_STORE_HEADERS, status: 413 }
    )
  }

  try {
    const capture = provisionalPageViewCaptureSchema.parse(
      JSON.parse(body)
    )
    const status = await store.capture(capture)

    console.info('[tracking] provisional page_view captured', {
      capture_state: capture.capture_state,
      event_id: capture.event.event_id,
      has_click_id: Boolean(capture.event.click_id),
      page_url: redactPageUrlForLog(capture.event.page_url),
      page_view_id: capture.event.page_view_id,
      status
    })

    return Response.json(
      { event_id: capture.event.event_id, status },
      {
        headers: NO_STORE_HEADERS,
        status: status === 'inserted' ? 202 : 200
      }
    )
  } catch (error) {
    if (
      error instanceof ZodError ||
      error instanceof SyntaxError
    ) {
      return Response.json(
        { error: 'invalid_capture' },
        { headers: NO_STORE_HEADERS, status: 400 }
      )
    }

    console.error(
      '[tracking] provisional page_view capture failed',
      {
        error_name:
          error instanceof Error ? error.name : 'UnknownError'
      }
    )
    return Response.json(
      { error: 'internal_error' },
      { headers: NO_STORE_HEADERS, status: 500 }
    )
  }
}
