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

function logTraceDrainRejection(
  code: string,
  counts: Record<string, number> = {}
): void {
  console.warn(
    JSON.stringify({
      code,
      component: 'vercel-trace-drain',
      event: 'request_rejected',
      ...counts
    })
  )
}

const databaseFailureCategories = new Map<string, string>([
  ['28P01', 'authentication_failed'],
  ['3D000', 'invalid_database'],
  ['42501', 'insufficient_privilege'],
  ['42P01', 'undefined_table'],
  ['53300', 'too_many_connections'],
  ['57P03', 'cannot_connect_now'],
  ['CERT_HAS_EXPIRED', 'tls_certificate_error'],
  ['DEPTH_ZERO_SELF_SIGNED_CERT', 'tls_certificate_error'],
  ['ECONNREFUSED', 'connection_refused'],
  ['ECONNRESET', 'connection_reset'],
  ['EHOSTUNREACH', 'host_unreachable'],
  ['ENOTFOUND', 'host_not_found'],
  ['ETIMEDOUT', 'connection_timeout'],
  ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'tls_certificate_error']
])

function databaseFailureCategory(error: unknown): string {
  const pending: unknown[] = [error]
  const seen = new Set<object>()

  while (pending.length > 0 && seen.size < 16) {
    const candidate = pending.shift()
    if (!candidate || typeof candidate !== 'object') continue
    if (seen.has(candidate)) continue
    seen.add(candidate)

    const code = 'code' in candidate ? candidate.code : undefined
    if (typeof code === 'string') {
      const category = databaseFailureCategories.get(code)
      if (category) return category
      if (code.startsWith('08')) return 'connection_exception'
    }

    if ('cause' in candidate) pending.push(candidate.cause)
    if ('errors' in candidate && Array.isArray(candidate.errors)) {
      pending.push(...candidate.errors.slice(0, 8))
    }
  }

  return 'database_error'
}

function traceScopeCounts(
  result: ReturnType<typeof sanitizeVercelTraceEnvelope>
): Record<string, number> {
  return {
    attributes_empty_resource_count:
      result.attributesEmptyResourceCount,
    conflicting_trace_id_count: result.conflictingTraceIdCount,
    deployment_scope_key_only_resource_count:
      result.deploymentScopeKeyOnlyResourceCount,
    invalid_resource_count: result.invalidResourceCount,
    invalid_span_count: result.invalidSpanCount,
    invalid_timestamp_span_count: result.invalidTimestampSpanCount,
    mismatched_project_id_resource_count:
      result.mismatchedProjectIdResourceCount,
    missing_deployment_id_resource_count:
      result.missingDeploymentIdResourceCount,
    missing_project_id_resource_count:
      result.missingProjectIdResourceCount,
    observation_count: result.observations.length,
    project_scope_key_only_resource_count:
      result.projectScopeKeyOnlyResourceCount,
    received_span_count: result.receivedSpanCount,
    rejected_span_count: result.rejectedSpanCount,
    scope_keys_absent_resource_count:
      result.scopeKeysAbsentResourceCount,
    scope_keys_present_but_invalid_resource_count:
      result.scopeKeysPresentButInvalidResourceCount,
    service_name_attribute_present_resource_count:
      result.serviceNameAttributePresentResourceCount,
    vercel_scope_name_present_resource_count:
      result.vercelScopeNamePresentResourceCount
  }
}

async function readRejectionCode(response: Response): Promise<string> {
  try {
    const body = (await response.clone().json()) as {
      code?: unknown
    }
    return typeof body.code === 'string' ?
        body.code
      : 'unclassified_request_rejection'
  } catch {
    return 'unclassified_request_rejection'
  }
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
    if (!signedRequest.success) {
      logTraceDrainRejection(
        await readRejectionCode(signedRequest.response)
      )
      return signedRequest.response
    }

    const parsedEnvelope = vercelTraceEnvelopeSchema.safeParse(
      signedRequest.parsedBody
    )
    if (!parsedEnvelope.success) {
      logTraceDrainRejection('invalid_trace_envelope', {
        schema_issue_count: parsedEnvelope.error.issues.length
      })
      return jsonDrainResponse(
        { code: 'invalid_trace_envelope' },
        400
      )
    }

    const result = sanitizeVercelTraceEnvelope(
      parsedEnvelope.data,
      config
    )
    if (result.observations.length === 0) {
      logTraceDrainRejection(
        'invalid_trace_scope',
        traceScopeCounts(result)
      )
      return jsonDrainResponse(
        { code: 'invalid_trace_scope' },
        400
      )
    }

    try {
      await upsertObservations(result.observations)

      if (
        result.invalidResourceCount > 0 ||
        result.invalidSpanCount > 0
      ) {
        logTraceDrainRejection(
          'partial_trace_scope',
          traceScopeCounts(result)
        )
        return jsonDrainResponse(
          {
            partialSuccess: {
              errorMessage:
                'Unscoped or invalid spans were rejected',
              rejectedSpans: result.rejectedSpanCount.toString()
            }
          },
          200
        )
      }

      return jsonDrainResponse({}, 200)
    } catch (error) {
      console.error(
        JSON.stringify({
          component: 'vercel-trace-drain',
          error_category: databaseFailureCategory(error),
          event: 'database_write_failed'
        })
      )
      return jsonDrainResponse(
        { code: 'database_unavailable' },
        503
      )
    }
  }
}
