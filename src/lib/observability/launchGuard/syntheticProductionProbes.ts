import 'server-only'

import { createHash } from 'node:crypto'
import { parseIntegrationHealthSnapshot } from './integrationHealthSnapshot'
import type { IntegrationHealthSnapshot } from './integrationHealthSnapshot'

const PROBE_TIMEOUT_MS = 8_000
const GTM_ID = 'GTM-5TWMJQFP'

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>

type ProbeContext = {
  cronSecret: string
  fetch: FetchLike
  now: () => Date
  origin: string
  runId: string
}

type ProbeValidation = {
  ok: boolean
  resultCode: string
}

type ProbeDefinition = {
  authorizeWithCronSecret?: boolean
  body?: string
  critical: boolean
  expected: (
    response: Response,
    body: string
  ) => ProbeValidation
  headers?: Readonly<Record<string, string>>
  integration: string
  method?: 'GET' | 'POST'
  path: string
  surface: string
}

const INVALID_CONTRACT_BODY = '{}'
const JSON_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
} as const

const probes: readonly ProbeDefinition[] = [
  {
    critical: true,
    expected: (response, body) => ({
      ok:
        response.status === 200 &&
        body.includes('data-skreddersy-route'),
      resultCode:
        response.status === 200 ?
          body.includes('data-skreddersy-route') ?
            'route_marker_present'
          : 'route_marker_missing'
        : 'unexpected_status'
    }),
    integration: 'vercel',
    path: '/skreddersy-varmen',
    surface: 'skreddersy_varmen_route'
  },
  {
    authorizeWithCronSecret: true,
    body: JSON.stringify({
      context: { pathname: '/skreddersy-varmen' },
      data: { source: 'launch_guard' },
      event: 'client_health_probe',
      level: 'info'
    }),
    critical: true,
    expected: response => ({
      ok: response.status === 200,
      resultCode:
        response.status === 200 ?
          'valid_probe_accepted'
        : 'valid_probe_rejected'
    }),
    headers: JSON_HEADERS,
    integration: 'vercel',
    method: 'POST',
    path: '/api/log',
    surface: 'api_log_contract'
  },
  ...[
    ['page_view_collector', '/api/events/page-view'],
    ['add_to_cart_collector', '/api/events/add-to-cart'],
    ['begin_checkout_collector', '/api/events/begin-checkout']
  ].map(([surface, path]) => ({
    body: INVALID_CONTRACT_BODY,
    critical: true,
    expected: (response: Response) => ({
      ok: response.status === 400,
      resultCode:
        response.status === 400 ?
          'invalid_contract_rejected'
        : 'invalid_contract_unexpected_status'
    }),
    headers: JSON_HEADERS,
    integration: 'supabase',
    method: 'POST' as const,
    path: path as string,
    surface: surface as string
  })),
  {
    body: INVALID_CONTRACT_BODY,
    critical: true,
    expected: response => ({
      ok: response.status === 400,
      resultCode:
        response.status === 400 ?
          'invalid_cart_rejected'
        : 'invalid_cart_unexpected_status'
    }),
    headers: JSON_HEADERS,
    integration: 'shopify',
    method: 'POST',
    path: '/api/cart/lines',
    surface: 'cart_contract'
  },
  {
    critical: true,
    expected: response => ({
      ok: response.status === 303,
      resultCode:
        response.status === 303 ?
          'empty_cart_redirected'
        : 'checkout_unexpected_status'
    }),
    integration: 'shopify',
    path: '/api/cart/checkout',
    surface: 'checkout_contract'
  },
  {
    critical: true,
    expected: (response, body) => ({
      ok:
        response.status === 200 &&
        body.includes('Google Tag Manager'),
      resultCode:
        response.status === 200 ?
          body.includes('Google Tag Manager') ?
            'gtm_loader_present'
          : 'gtm_loader_invalid'
        : 'gtm_unexpected_status'
    }),
    integration: 'gtm',
    path: `/__gtg/gtm.js?id=${GTM_ID}`,
    surface: 'web_container_loader'
  },
  {
    critical: true,
    expected: response => {
      const noStore =
        response.headers.get('cache-control')?.includes('no-store') ===
        true

      return {
        ok: response.status === 200 && noStore,
        resultCode:
          response.status !== 200 ?
            'sgtm_unexpected_status'
          : noStore ?
            'sgtm_healthy_no_store'
          : 'sgtm_cache_policy_invalid'
      }
    },
    integration: 'sgtm',
    path: '/__sgtm/healthy',
    surface: 'server_container_health'
  }
]

function fingerprint(surface: string, resultCode: string) {
  const digest = createHash('sha256')
    .update(`${surface}:${resultCode}`)
    .digest('hex')
    .slice(0, 24)

  return `probe:${surface}:${digest}`
}

function normalizeOrigin(origin: string) {
  const url = new URL(origin)

  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('launch_guard_origin_must_use_https')
  }

  url.pathname = '/'
  url.search = ''
  url.hash = ''
  return url
}

async function runProbe(
  definition: ProbeDefinition,
  context: ProbeContext
): Promise<IntegrationHealthSnapshot> {
  const startedAt = performance.now()
  const checkedAt = context.now().toISOString()
  let statusCode = 0
  let validation: ProbeValidation

  try {
    const url = new URL(
      definition.path,
      normalizeOrigin(context.origin)
    )
    const response = await context.fetch(url, {
      ...(definition.body === undefined ?
        {}
      : { body: definition.body }),
      cache: 'no-store',
      headers: {
        ...definition.headers,
        ...(definition.authorizeWithCronSecret ?
          {
            Authorization: `Bearer ${context.cronSecret}`
          }
        : {}),
        'User-Agent': 'Utekos-Launch-Guard/1.0',
        'X-Utekos-Automation': 'synthetic'
      },
      method: definition.method ?? 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS)
    })
    statusCode = response.status
    const body = (await response.text()).slice(0, 512_000)
    validation = definition.expected(response, body)
  } catch {
    validation = { ok: false, resultCode: 'network_or_timeout' }
  }

  const durationMs = Math.max(
    0,
    Math.round(performance.now() - startedAt)
  )

  return parseIntegrationHealthSnapshot({
    runId: context.runId,
    integration: definition.integration,
    surface: definition.surface,
    status: validation.ok ? 'healthy' : 'unhealthy',
    severity:
      validation.ok ? 'info'
      : definition.critical ? 'critical'
      : 'high',
    checkedAt,
    sampleCount: 1,
    errorCount: validation.ok ? 0 : 1,
    evidenceLevel: 'synthetic_probe',
    providerReceiptStatus: 'not_applicable',
    ...(validation.ok ?
      {}
    : {
        errorFingerprint: fingerprint(
          definition.surface,
          validation.resultCode
        ),
        safeAction: 'retry_probe_once'
      }),
    resultCode: validation.resultCode,
    measurements: {
      duration_ms: durationMs,
      status_code: statusCode
    }
  })
}

export async function runSyntheticProductionProbes(
  context: ProbeContext,
  surfaces?: ReadonlySet<string>
) {
  const selected =
    surfaces ?
      probes.filter(probe => surfaces.has(probe.surface))
    : probes

  return Promise.all(
    selected.map(probe => runProbe(probe, context))
  )
}

export const SYNTHETIC_PRODUCTION_PROBE_SURFACES =
  probes.map(probe => probe.surface)
