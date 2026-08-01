import { z } from 'zod'
import { pageViewDispatchObservationSchema } from '../pageViewDispatchObservation'
import type { BrowserEventTrafficVerdict } from './classifyBrowserEventTraffic'
import type { PageViewFunnelObservationStore } from './pageViewFunnelObservationStore'

const MAX_BODY_BYTES = 4 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

export type PageViewDispatchObservationDependencies = {
  classifyTraffic: (
    request: Request
  ) => Promise<BrowserEventTrafficVerdict>
  store: PageViewFunnelObservationStore
  verifyCorrelation: (input: {
    edgeRequestId: string
    token: string
  }) => Promise<boolean>
}

function response(
  body: Record<string, unknown>,
  status: number
) {
  return Response.json(body, {
    headers: NO_STORE_HEADERS,
    status
  })
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

export async function handlePageViewDispatchObservationRequest(
  request: Request,
  dependencies: PageViewDispatchObservationDependencies
) {
  if (!hasSameOrigin(request)) {
    return response({ error: 'forbidden_origin' }, 403)
  }

  if (
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() !== 'application/json'
  ) {
    return response({ error: 'unsupported_media_type' }, 415)
  }

  const declaredLength = Number(
    request.headers.get('content-length') ?? 0
  )
  if (declaredLength > MAX_BODY_BYTES) {
    return response({ error: 'payload_too_large' }, 413)
  }

  const body = await request.text()
  if (
    new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES
  ) {
    return response({ error: 'payload_too_large' }, 413)
  }

  let observation
  try {
    observation = pageViewDispatchObservationSchema.parse(
      JSON.parse(body)
    )
  } catch (error) {
    return response(
      {
        error:
          error instanceof z.ZodError ?
            'invalid_observation'
          : 'invalid_json'
      },
      400
    )
  }

  let verifiedCorrelation: boolean
  try {
    verifiedCorrelation = await dependencies.verifyCorrelation({
      edgeRequestId: observation.edge_request_id,
      token: observation.correlation_token
    })
  } catch {
    return response({ error: 'verification_unavailable' }, 503)
  }

  if (!verifiedCorrelation) {
    return response({ error: 'invalid_correlation' }, 403)
  }

  const traffic = await dependencies.classifyTraffic(request)
  const inserted =
    await dependencies.store.recordBrowserDispatch({
      edgeRequestId: observation.edge_request_id,
      eventId: observation.event_id,
      observedAt: new Date().toISOString(),
      pageViewId: observation.page_view_id,
      trafficClassification: traffic.classification
    })

  return response(
    { status: inserted ? 'accepted' : 'duplicate' },
    inserted ? 202 : 200
  )
}
