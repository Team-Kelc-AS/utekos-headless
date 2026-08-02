import { z } from 'zod'

import {
  type DrainRuntimeConfig,
  type VercelEdgeRequestObservation,
  type VercelLogEntry,
  vercelLogEntrySchema
} from './contracts.ts'
import { computeHmacHex } from './crypto.ts'
import { deriveLandingEdgeRequestId } from '../_shared/landing-edge-request-id.ts'

const EDGE_MESSAGE_PREFIX = '[landing-edge] '
const MAX_EDGE_MESSAGE_LENGTH = 96
const edgeRequestMessageSchema = z
  .object({ edge_request_id: z.string().uuid() })
  .strict()

const ASSET_PATH_PATTERN =
  /\.(?:avif|bmp|css|csv|gif|ico|jpe?g|js|json|map|mp3|mp4|pdf|png|svg|txt|webmanifest|webp|woff2?|xml)$/i
const SAFE_MARKETING_TOKEN_PATTERN = /^[A-Za-z0-9._~:+/-]+$/
const META_ID_PATTERN = /^\d{5,32}$/
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

function readReferrerHost(
  value: string | undefined
): string | null {
  if (!value) return null

  try {
    return normalizeHostname(new URL(value).hostname)
  } catch {
    return null
  }
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

function readSafeMarketingToken(
  parameters: URLSearchParams,
  name: string,
  maxLength = 128
): string | null {
  const value = parameters.get(name)?.trim()
  if (
    !value ||
    value.length > maxLength ||
    !SAFE_MARKETING_TOKEN_PATTERN.test(value)
  ) {
    return null
  }

  return value
}

function readMetaId(
  parameters: URLSearchParams,
  names: string[]
): string | null {
  for (const name of names) {
    const value = parameters.get(name)?.trim()
    if (value && META_ID_PATTERN.test(value)) return value
  }

  return null
}

function parseEdgeRequestId(
  message: string | undefined
): string | null {
  if (
    !message ||
    message.length > MAX_EDGE_MESSAGE_LENGTH ||
    !message.startsWith(EDGE_MESSAGE_PREFIX)
  ) {
    return null
  }

  try {
    const parsed = edgeRequestMessageSchema.safeParse(
      JSON.parse(message.slice(EDGE_MESSAGE_PREFIX.length))
    )
    return parsed.success ? parsed.data.edge_request_id : null
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

interface UserAgentClassification {
  inAppBrowser: VercelEdgeRequestObservation['in_app_browser']
  deviceClass: VercelEdgeRequestObservation['device_class']
  osClass: VercelEdgeRequestObservation['os_class']
  automationClass: VercelEdgeRequestObservation['automation_class']
}

function classifyUserAgent(
  userAgents: string[],
  verifiedSyntheticMarker: boolean
): UserAgentClassification {
  const userAgent = userAgents.join(' ').trim()
  const normalized = userAgent.toLowerCase()

  const automationClass: UserAgentClassification['automationClass'] =
    verifiedSyntheticMarker ? 'synthetic_client'
    : (
      /googlebot|bingbot|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|pinterestbot|applebot|bytespider|semrushbot|ahrefsbot|mj12bot/.test(
        normalized
      )
    ) ?
      'known_bot_user_agent'
    : (
      /curl\/|wget\/|python-requests|python-httpx|postmanruntime|insomnia|uptimerobot|pingdom|k6\/|artillery|node-fetch|axios\/|undici/.test(
        normalized
      )
    ) ?
      'synthetic_client'
    : (
      /headlesschrome|playwright|puppeteer|selenium|phantomjs|webdriver/.test(
        normalized
      )
    ) ?
      'browser_automation'
    : 'human_or_unknown'

  const inAppBrowser: UserAgentClassification['inAppBrowser'] =
    !userAgent ? 'unknown'
    : /instagram/i.test(userAgent) ? 'instagram'
    : /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(userAgent) ? 'facebook'
    : 'none'

  const deviceClass: UserAgentClassification['deviceClass'] =
    automationClass === 'known_bot_user_agent' ? 'bot'
    : /iphone|ipod|mobile/i.test(userAgent) ? 'mobile'
    : /ipad|tablet|android/i.test(userAgent) ? 'tablet'
    : /windows|macintosh|x11|linux/i.test(userAgent) ? 'desktop'
    : 'unknown'

  const osClass: UserAgentClassification['osClass'] =
    /iphone|ipad|ipod/i.test(userAgent) ? 'ios'
    : /android/i.test(userAgent) ? 'android'
    : /windows/i.test(userAgent) ? 'windows'
    : /macintosh|mac os x/i.test(userAgent) ? 'macos'
    : /linux|x11/i.test(userAgent) ? 'linux'
    : userAgent ? 'other'
    : 'unknown'

  return { automationClass, deviceClass, inAppBrowser, osClass }
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

  const referrerHost = readReferrerHost(proxy.referer)
  if (referrerHost && config.allowedHosts.includes(referrerHost))
    return null

  const utmCampaign = readSafeMarketingToken(
    documentUrl.searchParams,
    'utm_campaign'
  )
  const verifiedSyntheticMarker =
    /^(?:codex|edgeidprobe)[_-]/i.test(utmCampaign ?? '')

  const fbclid = documentUrl.searchParams.get('fbclid')?.trim()
  const fbclidPresent = Boolean(fbclid)
  const fbclidHmac =
    fbclid ?
      await computeHmacHex(
        fbclid,
        config.fbclidHmacSecret,
        'SHA-256'
      )
    : null
  const userAgent = classifyUserAgent(
    proxy.userAgent,
    verifiedSyntheticMarker
  )

  return {
    vercel_log_id: entry.id,
    edge_request_id:
      parseEdgeRequestId(entry.message) ??
      (await deriveLandingEdgeRequestId(entry.requestId)) ??
      null,
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
    route_pathname: documentUrl.pathname,
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
    referrer_host: referrerHost,
    in_app_browser: userAgent.inAppBrowser,
    device_class: userAgent.deviceClass,
    os_class: userAgent.osClass,
    automation_class: userAgent.automationClass,
    fbclid_present: fbclidPresent,
    fbclid_hmac: fbclidHmac,
    utm_source: readSafeMarketingToken(
      documentUrl.searchParams,
      'utm_source'
    ),
    utm_medium: readSafeMarketingToken(
      documentUrl.searchParams,
      'utm_medium'
    ),
    utm_campaign: utmCampaign,
    utm_content: readSafeMarketingToken(
      documentUrl.searchParams,
      'utm_content'
    ),
    utm_term: readSafeMarketingToken(
      documentUrl.searchParams,
      'utm_term'
    ),
    meta_campaign_id: readMetaId(documentUrl.searchParams, [
      'campaign_id',
      'utm_campaign_id',
      'utm_id'
    ]),
    meta_adset_id: readMetaId(documentUrl.searchParams, [
      'adset_id'
    ]),
    meta_ad_id: readMetaId(documentUrl.searchParams, [
      'ad_id',
      'utm_content'
    ]),
    meta_placement: readSafeMarketingToken(
      documentUrl.searchParams,
      'placement',
      64
    ),
    meta_site_source_name: readSafeMarketingToken(
      documentUrl.searchParams,
      'site_source_name',
      32
    )
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
