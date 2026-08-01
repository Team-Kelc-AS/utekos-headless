import { z } from 'zod'
import {
  classifyLandingConsentDecision,
  landingConsentObservationSchema,
  type LandingConsentDecision
} from '../landingConsentObservation'
import {
  classifyBrowserEventTraffic,
  type BrowserEventTrafficVerdict
} from './classifyBrowserEventTraffic'

const MAX_BODY_BYTES = 8 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json; charset=utf-8'
}

export type LandingConsentObservationRow = {
  analyticsGranted: boolean
  decision: LandingConsentDecision
  edgeRequestId: string
  marketingGranted: boolean
  pageViewId: string
  preferencesGranted: boolean
  trafficClassification: BrowserEventTrafficVerdict['classification']
}

export type LandingConsentObservationStore = {
  upsert: (row: LandingConsentObservationRow) => Promise<boolean>
}

export type LandingConsentObservationDependencies = {
  classifyTraffic: (
    request: Request
  ) => Promise<BrowserEventTrafficVerdict>
  store: LandingConsentObservationStore
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

export async function handleLandingConsentObservationRequest(
  request: Request,
  dependencies: LandingConsentObservationDependencies
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
    observation = landingConsentObservationSchema.parse(
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

  const stored = await dependencies.store.upsert({
    analyticsGranted:
      observation.consent.analytics === 'granted',
    decision: classifyLandingConsentDecision(
      observation.consent
    ),
    edgeRequestId: observation.edge_request_id,
    marketingGranted:
      observation.consent.marketing === 'granted',
    pageViewId: observation.page_view_id,
    preferencesGranted:
      observation.consent.preferences === 'granted',
    trafficClassification: traffic.classification
  })
  if (!stored) {
    return response({ error: 'observation_limit_reached' }, 429)
  }

  return response({ status: 'accepted' }, 202)
}

export const defaultLandingConsentClassifier =
  classifyBrowserEventTraffic
