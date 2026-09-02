import { ZodError } from 'zod'
import { hasValidBearerAuthorization } from '@/lib/security/hasValidBearerAuthorization'
import { metaNonWebEventIngestSchema } from '../metaNonWebIngestContract'
import { acceptMetaNonWebEvent } from './acceptMetaNonWebEvent'
import { MetaNonWebEventTimeError } from './normalizeMetaNonWebIngestEvent'
import { postgresCanonicalEventStore } from './postgresCanonicalPageViewStore'

const MAX_BODY_BYTES = 64 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0'
}

type MetaNonWebSourceType = 'app' | 'offline'

export type MetaNonWebEventRequestDependencies = {
  accept: (input: {
    payload: unknown
  }) => ReturnType<typeof acceptMetaNonWebEvent>
  getIngestSecret: () => string | undefined
  isSourceEnabled: (sourceType: MetaNonWebSourceType) => boolean
}

const defaultDependencies: MetaNonWebEventRequestDependencies = {
  accept: input =>
    acceptMetaNonWebEvent({
      payload: input.payload,
      store: postgresCanonicalEventStore
    }),
  getIngestSecret: () =>
    process.env.META_NON_WEB_EVENTS_INGEST_SECRET,
  isSourceEnabled: sourceType =>
    sourceType === 'app' ?
      process.env.META_APP_EVENTS_ENABLED === 'true'
    : process.env.META_OFFLINE_EVENTS_ENABLED === 'true'
}

function jsonResponse(body: unknown, status: number) {
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

export async function handleMetaNonWebEventRequest(
  request: Request,
  dependencies: MetaNonWebEventRequestDependencies = defaultDependencies
) {
  const secret = dependencies.getIngestSecret()

  if (!secret) {
    return jsonResponse({ error: 'ingest_not_configured' }, 503)
  }
  if (
    !hasValidBearerAuthorization(
      request.headers.get('authorization'),
      secret
    )
  ) {
    return jsonResponse({ error: 'unauthorized' }, 401)
  }
  if (!hasJsonMediaType(request)) {
    return jsonResponse({ error: 'unsupported_media_type' }, 415)
  }

  const declaredLength = Number(
    request.headers.get('content-length') ?? 0
  )
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength < 0 ||
    declaredLength > MAX_BODY_BYTES
  ) {
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  const rawBody = await request.text()
  if (
    new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES
  ) {
    return jsonResponse({ error: 'payload_too_large' }, 413)
  }

  let rawInput: unknown
  try {
    rawInput = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const input = metaNonWebEventIngestSchema.safeParse(rawInput)
  if (!input.success) {
    return jsonResponse({ error: 'invalid_event' }, 400)
  }
  if (!dependencies.isSourceEnabled(input.data.source_type)) {
    return jsonResponse({ error: 'source_disabled' }, 503)
  }

  try {
    const result = await dependencies.accept({
      payload: input.data
    })

    return jsonResponse(
      result,
      result.status === 'accepted' ? 202 : 200
    )
  } catch (error) {
    if (error instanceof MetaNonWebEventTimeError) {
      return jsonResponse(
        { error: 'event_time_outside_window' },
        422
      )
    }
    if (error instanceof ZodError) {
      return jsonResponse({ error: 'invalid_event' }, 400)
    }

    return jsonResponse({ error: 'ingest_failed' }, 500)
  }
}
