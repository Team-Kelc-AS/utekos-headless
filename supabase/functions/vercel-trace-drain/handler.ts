import {
  jsonDrainResponse,
  readSignedJsonDrainRequest
} from '../_shared/vercel-drain-http.ts'
import {
  MAX_TRACE_DRAIN_BODY_BYTES,
  type TraceDrainRuntimeConfig,
  vercelTraceEnvelopeSchema
} from './contracts.ts'
import type { TraceObservationWriter } from './database.ts'
import { sanitizeVercelTraceEnvelope } from './sanitize.ts'

export interface VercelTraceDrainHandlerDependencies {
  config: TraceDrainRuntimeConfig
  upsertObservations: TraceObservationWriter
}

export function createVercelTraceDrainHandler({
  config,
  upsertObservations
}: VercelTraceDrainHandlerDependencies): (
  request: Request
) => Promise<Response> {
  return async request => {
    const signedRequest = await readSignedJsonDrainRequest(
      request,
      config.signatureSecret,
      MAX_TRACE_DRAIN_BODY_BYTES
    )
    if (!signedRequest.success) return signedRequest.response

    const parsedEnvelope = vercelTraceEnvelopeSchema.safeParse(
      signedRequest.parsedBody
    )
    if (!parsedEnvelope.success) {
      return jsonDrainResponse(
        { code: 'invalid_trace_envelope' },
        400
      )
    }

    const result = sanitizeVercelTraceEnvelope(
      parsedEnvelope.data,
      config
    )
    if (
      result.invalidResourceCount > 0 ||
      result.invalidSpanCount > 0 ||
      result.observations.length === 0
    ) {
      return jsonDrainResponse(
        { code: 'invalid_trace_scope' },
        400
      )
    }

    try {
      await upsertObservations(result.observations)
      return jsonDrainResponse({}, 200)
    } catch {
      console.error('[vercel-trace-drain] database write failed')
      return jsonDrainResponse(
        { code: 'database_unavailable' },
        503
      )
    }
  }
}
