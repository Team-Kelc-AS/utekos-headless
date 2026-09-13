import {
  jsonDrainResponse,
  readSignedJsonDrainRequest
} from '../_shared/vercel-drain-http.ts'
import {
  MAX_DRAIN_BODY_BYTES,
  type DrainRuntimeConfig,
  vercelLogBatchSchema
} from './contracts.ts'
import type { ObservationWriter } from './database.ts'
import { sanitizeVercelLogBatch } from './sanitize.ts'
import { sanitizeDiagnosticBatch } from './diagnostics.ts'

export interface VercelLogDrainHandlerDependencies {
  config: DrainRuntimeConfig
  insertObservations: ObservationWriter
}

export function createVercelLogDrainHandler({
  config,
  insertObservations
}: VercelLogDrainHandlerDependencies): (
  request: Request
) => Promise<Response> {
  return async request => {
    const signedRequest = await readSignedJsonDrainRequest(
      request,
      config.signatureSecret,
      MAX_DRAIN_BODY_BYTES
    )
    if (!signedRequest.success) return signedRequest.response

    const batch = vercelLogBatchSchema.safeParse(
      signedRequest.parsedBody
    )
    if (!batch.success) {
      console.warn(
        JSON.stringify({
          code: 'invalid_batch',
          component: 'vercel-log-drain',
          event: 'request_rejected',
          issue_count: batch.error.issues.length,
          received_count:
            Array.isArray(signedRequest.parsedBody) ?
              signedRequest.parsedBody.length
            : null
        })
      )
      return jsonDrainResponse({ code: 'invalid_batch' }, 400)
    }

    const { duplicateCount, observations, rejectedCount } =
      await sanitizeVercelLogBatch(batch.data, config)
    const diagnostics = sanitizeDiagnosticBatch(
      batch.data,
      config
    )

    try {
      const { insertedCount, diagnosticInsertedCount } =
        await insertObservations(
          observations,
          diagnostics.observations
        )
      const diagnosticSummary = {
        selected_count: diagnostics.observations.length,
        inserted_count: diagnosticInsertedCount,
        duplicate_count:
          diagnostics.duplicates +
          diagnostics.observations.length -
          diagnosticInsertedCount,
        excluded_by_reason: diagnostics.reasons
      }
      const summary = {
        component: 'vercel-log-drain',
        event: 'batch_processed',
        received_count: batch.data.length,
        document_inserted_count: insertedCount,
        diagnostics: diagnosticSummary
      }
      if (diagnostics.reasons.invalid_schema > 0)
        console.warn(JSON.stringify(summary))
      else console.info(JSON.stringify(summary))
      return jsonDrainResponse(
        {
          duplicate_count:
            duplicateCount + observations.length - insertedCount,
          inserted_count: insertedCount,
          received_count: batch.data.length,
          rejected_count: rejectedCount,
          selected_count: observations.length,
          success: true,
          diagnostics: diagnosticSummary
        },
        200
      )
    } catch {
      console.error(
        JSON.stringify({
          component: 'vercel-log-drain',
          event: 'database_write_failed',
          retryable: true,
          received_count: batch.data.length
        })
      )
      return jsonDrainResponse(
        { code: 'database_unavailable' },
        503
      )
    }
  }
}
