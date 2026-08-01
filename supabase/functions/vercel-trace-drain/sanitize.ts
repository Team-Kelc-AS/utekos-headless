import type {
  TraceDrainRuntimeConfig,
  VercelTraceEnvelope,
  VercelTraceObservation
} from './contracts.ts'

const PROJECT_ID_ATTRIBUTE = 'vercel.projectId'
const DEPLOYMENT_ID_ATTRIBUTE = 'vercel.deploymentId'
const SERVICE_NAME_ATTRIBUTE = 'service.name'
const VERCEL_SCOPE_NAME = 'vercel'

interface MutableTraceObservation {
  traceId: string
  deploymentId: string
  projectId: string
  startTimeUnixNano: bigint
  endTimeUnixNano: bigint
  spanCount: number
}

export interface SanitizeTraceResult {
  observations: VercelTraceObservation[]
  receivedSpanCount: number
  attributesEmptyResourceCount: number
  deploymentScopeKeyOnlyResourceCount: number
  invalidResourceCount: number
  invalidSpanCount: number
  missingProjectIdResourceCount: number
  missingDeploymentIdResourceCount: number
  mismatchedProjectIdResourceCount: number
  projectScopeKeyOnlyResourceCount: number
  scopeKeysAbsentResourceCount: number
  scopeKeysPresentButInvalidResourceCount: number
  serviceNameAttributePresentResourceCount: number
  vercelScopeNamePresentResourceCount: number
  invalidTimestampSpanCount: number
  conflictingTraceIdCount: number
  rejectedSpanCount: number
}

function hasAttribute(
  attributes: VercelTraceEnvelope['resourceSpans'][number]['resource']['attributes'],
  name: string
): boolean {
  return attributes.some(attribute => attribute.key === name)
}

function hasVercelScopeName(
  scopeSpans: VercelTraceEnvelope['resourceSpans'][number]['scopeSpans'][number]
): boolean {
  const scope = scopeSpans.scope
  return (
    typeof scope === 'object' &&
    scope !== null &&
    'name' in scope &&
    scope.name === VERCEL_SCOPE_NAME
  )
}

function readStringAttribute(
  attributes: VercelTraceEnvelope['resourceSpans'][number]['resource']['attributes'],
  name: string
): string | null {
  const matches = attributes.filter(
    attribute => attribute.key === name
  )
  if (matches.length !== 1) return null

  const value = matches[0]?.value.stringValue?.trim()
  return value && value.length <= 256 ? value : null
}

function toIsoTimestamp(unixNanoseconds: bigint): string | null {
  const unixMilliseconds = unixNanoseconds / 1_000_000n
  if (unixMilliseconds > 4_102_444_800_000n) return null

  const value = new Date(Number(unixMilliseconds))
  return Number.isNaN(value.getTime()) ? null : (
      value.toISOString()
    )
}

function formatDurationMilliseconds(
  durationNanoseconds: bigint
): string {
  const wholeMilliseconds = durationNanoseconds / 1_000_000n
  const fractionalNanoseconds = durationNanoseconds % 1_000_000n
  if (fractionalNanoseconds === 0n)
    return wholeMilliseconds.toString()

  return `${wholeMilliseconds}.${fractionalNanoseconds.toString().padStart(6, '0').replace(/0+$/, '')}`
}

export function sanitizeVercelTraceEnvelope(
  envelope: VercelTraceEnvelope,
  config: TraceDrainRuntimeConfig
): SanitizeTraceResult {
  const traces = new Map<string, MutableTraceObservation>()
  const traceSpanTotals = new Map<string, number>()
  const conflictingTraceIds = new Set<string>()
  let receivedSpanCount = 0
  let attributesEmptyResourceCount = 0
  let deploymentScopeKeyOnlyResourceCount = 0
  let invalidResourceCount = 0
  let invalidSpanCount = 0
  let missingProjectIdResourceCount = 0
  let missingDeploymentIdResourceCount = 0
  let mismatchedProjectIdResourceCount = 0
  let projectScopeKeyOnlyResourceCount = 0
  let scopeKeysAbsentResourceCount = 0
  let scopeKeysPresentButInvalidResourceCount = 0
  let serviceNameAttributePresentResourceCount = 0
  let vercelScopeNamePresentResourceCount = 0
  let invalidTimestampSpanCount = 0
  let rejectedSpanCount = 0

  for (const resourceSpans of envelope.resourceSpans) {
    const attributes = resourceSpans.resource.attributes
    const hasProjectScopeKey = hasAttribute(
      attributes,
      PROJECT_ID_ATTRIBUTE
    )
    const hasDeploymentScopeKey = hasAttribute(
      attributes,
      DEPLOYMENT_ID_ATTRIBUTE
    )
    const projectId = readStringAttribute(
      attributes,
      PROJECT_ID_ATTRIBUTE
    )
    const deploymentId = readStringAttribute(
      attributes,
      DEPLOYMENT_ID_ATTRIBUTE
    )
    const resourceSpanCount = resourceSpans.scopeSpans.reduce(
      (count, scopeSpans) => count + scopeSpans.spans.length,
      0
    )
    receivedSpanCount += resourceSpanCount

    if (attributes.length === 0) attributesEmptyResourceCount += 1
    if (hasAttribute(attributes, SERVICE_NAME_ATTRIBUTE))
      serviceNameAttributePresentResourceCount += 1
    if (resourceSpans.scopeSpans.some(hasVercelScopeName))
      vercelScopeNamePresentResourceCount += 1

    if (!hasProjectScopeKey && !hasDeploymentScopeKey)
      scopeKeysAbsentResourceCount += 1
    else if (hasProjectScopeKey && !hasDeploymentScopeKey)
      projectScopeKeyOnlyResourceCount += 1
    else if (!hasProjectScopeKey && hasDeploymentScopeKey)
      deploymentScopeKeyOnlyResourceCount += 1
    else if (!projectId || !deploymentId)
      scopeKeysPresentButInvalidResourceCount += 1

    if (!projectId) missingProjectIdResourceCount += 1
    if (!deploymentId) missingDeploymentIdResourceCount += 1
    if (projectId && projectId !== config.projectId)
      mismatchedProjectIdResourceCount += 1

    if (!projectId || !deploymentId || projectId !== config.projectId) {
      invalidResourceCount += 1
      rejectedSpanCount += resourceSpanCount
      continue
    }

    for (const scopeSpans of resourceSpans.scopeSpans) {
      for (const span of scopeSpans.spans) {
        const traceId = span.traceId.toLowerCase()
        const startTime = BigInt(span.startTimeUnixNano)
        const endTime = BigInt(span.endTimeUnixNano)
        if (
          endTime < startTime ||
          toIsoTimestamp(startTime) === null ||
          toIsoTimestamp(endTime) === null
        ) {
          invalidSpanCount += 1
          invalidTimestampSpanCount += 1
          rejectedSpanCount += 1
          continue
        }

        const existing = traces.get(traceId)
        traceSpanTotals.set(
          traceId,
          (traceSpanTotals.get(traceId) ?? 0) + 1
        )
        if (!existing) {
          traces.set(traceId, {
            deploymentId,
            endTimeUnixNano: endTime,
            projectId,
            spanCount: 1,
            startTimeUnixNano: startTime,
            traceId
          })
          continue
        }

        if (
          existing.projectId !== projectId ||
          existing.deploymentId !== deploymentId
        ) {
          conflictingTraceIds.add(traceId)
          continue
        }

        existing.startTimeUnixNano =
          startTime < existing.startTimeUnixNano ?
            startTime
          : existing.startTimeUnixNano
        existing.endTimeUnixNano =
          endTime > existing.endTimeUnixNano ?
            endTime
          : existing.endTimeUnixNano
        existing.spanCount += 1
      }
    }
  }

  for (const traceId of conflictingTraceIds) {
    traces.delete(traceId)
    invalidSpanCount += 1
    rejectedSpanCount += traceSpanTotals.get(traceId) ?? 0
  }

  return {
    attributesEmptyResourceCount,
    deploymentScopeKeyOnlyResourceCount,
    observations: Array.from(traces.values(), trace => ({
      deployment_id: trace.deploymentId,
      duration_ms: formatDurationMilliseconds(
        trace.endTimeUnixNano - trace.startTimeUnixNano
      ),
      end_time_unix_nano: trace.endTimeUnixNano.toString(),
      environment: config.environment,
      observed_at: toIsoTimestamp(trace.startTimeUnixNano)!,
      project_id: trace.projectId,
      span_count: trace.spanCount,
      start_time_unix_nano: trace.startTimeUnixNano.toString(),
      trace_id: trace.traceId
    })),
    invalidResourceCount,
    invalidSpanCount,
    missingProjectIdResourceCount,
    missingDeploymentIdResourceCount,
    mismatchedProjectIdResourceCount,
    projectScopeKeyOnlyResourceCount,
    scopeKeysAbsentResourceCount,
    scopeKeysPresentButInvalidResourceCount,
    serviceNameAttributePresentResourceCount,
    vercelScopeNamePresentResourceCount,
    invalidTimestampSpanCount,
    conflictingTraceIdCount: conflictingTraceIds.size,
    rejectedSpanCount,
    receivedSpanCount
  }
}
