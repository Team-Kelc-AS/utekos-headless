import {
  type DrainRuntimeConfig,
  type VercelEdgeRequestObservation,
  type VercelLogEntry,
  vercelLogEntrySchema
} from './contracts.ts'
import { operationalRoute } from '../_shared/operational-route.ts'

const ASSET_PATH_PATTERN =
  /\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|txt|webmanifest|webp|woff2?|xml)$/i
const TRACE_ID_PATTERN = /^[0-9a-fA-F]{32}$/

function normalizeHostname(value: string): string | null {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
  if (
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      normalized
    )
  ) {
    return null
  }

  return normalized
}

function readDocumentUrl(path: string): URL | null {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return null
  }

  try {
    const url = new URL(path, 'https://drain.invalid')
    const pathname = url.pathname
    const isInternalSurface =
      pathname === '/api' ||
      pathname.startsWith('/api/') ||
      pathname === '/_next' ||
      pathname.startsWith('/_next/') ||
      pathname === '/__gtg' ||
      pathname.startsWith('/__gtg/') ||
      pathname === '/__sgtm' ||
      pathname.startsWith('/__sgtm/')

    if (
      pathname.length > 2048 ||
      isInternalSurface ||
      ASSET_PATH_PATTERN.test(pathname)
    )
      return null

    return url
  } catch {
    return null
  }
}

function readTraceId(entry: VercelLogEntry): string | null {
  const value = entry.traceId ?? entry['trace.id']
  return value && TRACE_ID_PATTERN.test(value) ?
      value.toLowerCase()
    : null
}

async function mapEntryToObservation(
  entry: VercelLogEntry,
  config: DrainRuntimeConfig
): Promise<VercelEdgeRequestObservation | null> {
  const proxy = entry.proxy
  if (
    !proxy ||
    entry.source === 'build' ||
    entry.projectId !== config.projectId ||
    entry.environment !== config.environment ||
    proxy.pathType === 'api' ||
    proxy.pathType === 'background_func'
  ) {
    return null
  }

  const host = normalizeHostname(proxy.host)
  if (!host || !config.allowedHosts.includes(host)) return null

  const method = proxy.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return null

  const documentUrl = readDocumentUrl(proxy.path)
  const statusCode = proxy.statusCode ?? entry.statusCode
  if (
    !documentUrl ||
    documentUrl.searchParams.has('_rsc') ||
    statusCode === undefined
  )
    return null

  return {
    data_policy: 'operational_v1',
    vercel_log_id: entry.id,
    edge_request_id: null,
    deployment_id: entry.deploymentId,
    project_id: entry.projectId,
    environment: entry.environment,
    observed_at: new Date(proxy.timestamp).toISOString(),
    observation_type:
      (
        entry.source === 'redirect' ||
        (statusCode >= 300 && statusCode <= 399)
      ) ?
        'redirect'
      : 'document',
    request_id: entry.requestId ?? null,
    trace_id: readTraceId(entry),
    vercel_id: proxy.vercelId ?? null,
    route_pathname: operationalRoute(documentUrl.pathname),
    host,
    method,
    source: entry.source,
    status_code: statusCode,
    cache_status: proxy.vercelCache ?? null,
    waf_action: proxy.wafAction ?? null,
    path_type: proxy.pathType ?? null,
    path_type_variant: proxy.pathTypeVariant ?? null,
    edge_region: proxy.region,
    execution_region: entry.executionRegion ?? null,
    lambda_region: proxy.lambdaRegion ?? null,
    response_bytes: proxy.responseByteSize ?? null,
    referrer_host: null,
    in_app_browser: 'unknown',
    device_class: 'unknown',
    os_class: 'unknown',
    automation_class: 'human_or_unknown',
    fbclid_present: false,
    fbclid_hmac: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    meta_campaign_id: null,
    meta_adset_id: null,
    meta_ad_id: null,
    meta_placement: null,
    meta_site_source_name: null
  }
}

export interface SanitizeBatchResult {
  observations: VercelEdgeRequestObservation[]
  duplicateCount: number
  rejectedCount: number
}

export async function sanitizeVercelLogBatch(
  values: unknown[],
  config: DrainRuntimeConfig
): Promise<SanitizeBatchResult> {
  const candidates = await Promise.all(
    values.map(async value => {
      const parsed = vercelLogEntrySchema.safeParse(value)
      return parsed.success ?
          mapEntryToObservation(parsed.data, config)
        : null
    })
  )
  const observationsByLogId = new Map<
    string,
    VercelEdgeRequestObservation
  >()
  let selectedCount = 0

  for (const candidate of candidates) {
    if (candidate) {
      selectedCount += 1
      observationsByLogId.set(candidate.vercel_log_id, candidate)
    }
  }

  return {
    observations: Array.from(observationsByLogId.values()),
    duplicateCount: selectedCount - observationsByLogId.size,
    rejectedCount: values.length - selectedCount
  }
}
