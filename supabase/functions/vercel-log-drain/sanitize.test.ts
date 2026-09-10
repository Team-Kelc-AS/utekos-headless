import assert from 'node:assert/strict'
import test from 'node:test'

import type { DrainRuntimeConfig } from './contracts.ts'
import { sanitizeVercelLogBatch } from './sanitize.ts'

const config: DrainRuntimeConfig = {
  allowedHosts: ['utekos.no', 'www.utekos.no'],
  databaseUrl:
    'postgresql://postgres:postgres@127.0.0.1:6543/postgres',
  environment: 'production',
  fbclidHmacSecret:
    'fbclid-secret-that-is-at-least-32-characters',
  projectId: 'prj_MpZN3Z0PDp8rfwpdzAeplGe4Di0s',
  signatureSecret: 'drain-secret-that-is-at-least-32-characters'
}

const edgeRequestId = '7bc89e3c-12fb-4c1a-8aa1-fba79c392fe5'
const fbclid = 'IwAR-Secret_Click-Identifier'
const traceId = '00112233445566778899AABBCCDDEEFF'

function validEntry(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    deploymentId: 'dpl_current',
    environment: 'production',
    executionRegion: 'arn1',
    host: 'utekos-headless.vercel.app',
    id: 'vercel-log-1',
    level: 'info',
    message: `[landing-edge] {"edge_request_id":"${edgeRequestId}"}`,
    projectId: config.projectId,
    proxy: {
      clientIp: '192.0.2.10',
      host: 'utekos.no',
      lambdaRegion: 'arn1',
      method: 'GET',
      path: `/skreddersy-varmen?fbclid=${fbclid}&utm_source=facebook&utm_medium=paid_social&utm_campaign=campaign_2026&campaign_id=120246491016410700&adset_id=120246491016410701&ad_id=120246491016410788&placement=Facebook_Mobile_Feed&site_source_name=fb`,
      pathType: 'partial_prerender',
      region: 'arn1',
      referer: 'https://l.facebook.com/?u=redacted',
      responseByteSize: 312000,
      statusCode: 200,
      timestamp: 1_754_029_200_123,
      userAgent: [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/520.0.0.0]'
      ],
      vercelCache: 'HIT',
      vercelId: 'arn1::request-1'
    },
    requestId: 'request-1',
    source: 'lambda',
    timestamp: 1_754_029_200_150,
    traceId,
    ...overrides
  }
}

test('operational v1 never retains attribution, browser classification or raw URL data', async () => {
  const result = await sanitizeVercelLogBatch(
    [validEntry()],
    config
  )
  const observation = result.observations[0]!
  assert.equal(observation.data_policy, 'operational_v1')
  assert.equal(observation.route_pathname, '/skreddersy-varmen')
  assert.equal(observation.status_code, 200)
  assert.equal(observation.response_bytes, 312000)
  assert.equal(observation.request_id, 'request-1')
  for (const key of [
    'edge_request_id',
    'fbclid_hmac',
    'referrer_host',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'meta_campaign_id',
    'meta_adset_id',
    'meta_ad_id',
    'meta_placement',
    'meta_site_source_name'
  ] as const)
    assert.equal(observation[key], null)
  assert.equal(observation.fbclid_present, false)
  assert.equal(observation.device_class, 'unknown')
  assert.equal(observation.os_class, 'unknown')
  assert.equal(observation.in_app_browser, 'unknown')
  const serialized = JSON.stringify(observation)
  for (const value of [
    fbclid,
    '192.0.2.10',
    'Mozilla',
    'FBAN',
    '120246491016410788'
  ])
    assert.equal(serialized.includes(value), false)
})
test('unknown path segments cannot carry names or other identifiers into operations', async () => {
  const proxy = validEntry().proxy as Record<string, unknown>
  for (const path of [
    '/John-Smith',
    '/produkter/private-name',
    '/magasinet/private-name'
  ]) {
    const result = await sanitizeVercelLogBatch(
      [validEntry({ proxy: { ...proxy, path } })],
      config
    )
    assert.doesNotMatch(
      result.observations[0]!.route_pathname,
      /John|private-name/
    )
  }
})
test('same-site document observations remain included without a referrer or person identity', async () => {
  const proxy = validEntry().proxy as Record<string, unknown>
  const result = await sanitizeVercelLogBatch(
    [
      validEntry({
        proxy: {
          ...proxy,
          referer: 'https://utekos.no/produkter'
        }
      })
    ],
    config
  )
  assert.equal(result.observations.length, 1)
  assert.equal(result.observations[0]!.referrer_host, null)
})
test('repeated vercel log IDs are deduplicated before the atomic database insert', async () => {
  const result = await sanitizeVercelLogBatch(
    [validEntry(), validEntry()],
    config
  )
  assert.equal(result.observations.length, 1)
  assert.equal(result.duplicateCount, 1)
})
test('rejects wrong project, environment, host, method and non-document paths', async () => {
  const baseProxy = validEntry().proxy as Record<string, unknown>
  const values = [
    validEntry({ id: 'wrong-project', projectId: 'prj_other' }),
    validEntry({
      environment: 'preview',
      id: 'wrong-environment'
    }),
    validEntry({
      id: 'wrong-host',
      proxy: { ...baseProxy, host: 'evil.example' }
    }),
    validEntry({
      id: 'wrong-method',
      proxy: { ...baseProxy, method: 'POST' }
    }),
    validEntry({
      id: 'api',
      proxy: {
        ...baseProxy,
        path: '/api/events?fbclid=secret',
        pathType: 'api'
      }
    }),
    validEntry({
      id: 'asset',
      proxy: { ...baseProxy, path: '/_next/app.js' }
    }),
    validEntry({
      id: 'background',
      proxy: { ...baseProxy, pathType: 'background_func' }
    }),
    validEntry({
      id: 'rsc',
      proxy: {
        ...baseProxy,
        path: '/produkter/utekos-dun?_rsc=abc123'
      }
    }),
    validEntry({ id: 'build', source: 'build' })
  ]

  const result = await sanitizeVercelLogBatch(values, config)
  assert.deepEqual(result.observations, [])
  assert.equal(result.rejectedCount, values.length)
})
