import type {
  TraceDrainRuntimeConfig,
  VercelTraceEnvelope,
  VercelTraceObservation
} from './contracts.ts'

const PROJECT_ID_ATTRIBUTE = 'vercel.projectId'
const DEPLOYMENT_ID_ATTRIBUTE = 'vercel.deploymentId'

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
  invalidResourceCount: number
  invalidSpanCount: number
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
  const conflictingTraceIds = new Set<string>()
  let receivedSpanCount = 0
  let invalidResourceCount = 0
  let invalidSpanCount = 0

  for (const resourceSpans of envelope.resourceSpans) {
    const projectId = readStringAttribute(
      resourceSpans.resource.attributes,
      PROJECT_ID_ATTRIBUTE
    )
    const deploymentId = readStringAttribute(
      resourceSpans.resource.attributes,
      DEPLOYMENT_ID_ATTRIBUTE
    )
    const resourceSpanCount = resourceSpans.scopeSpans.reduce(
      (count, scopeSpans) => count + scopeSpans.spans.length,
      0
    )
    receivedSpanCount += resourceSpanCount

    if (
      !projectId ||
      !deploymentId ||
      projectId !== config.projectId
    ) {
      invalidResourceCount += 1
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
          continue
        }

        const existing = traces.get(traceId)
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
  }

  return {
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
    receivedSpanCount
  }
}
