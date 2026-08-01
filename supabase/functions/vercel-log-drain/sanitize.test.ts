import assert from 'node:assert/strict'
import test from 'node:test'

import type { DrainRuntimeConfig } from './contracts.ts'
import { computeHmacHex } from './crypto.ts'
import { sanitizeVercelLogBatch } from './sanitize.ts'

const config: DrainRuntimeConfig = {
  allowedHosts: ['utekos.no', 'www.utekos.no'],
  databaseUrl:
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
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

test('keeps only a sanitized Meta landing observation', async () => {
  const result = await sanitizeVercelLogBatch(
    [validEntry()],
    config
  )
  const observation = result.observations[0]

  assert.ok(observation)
  assert.equal(result.duplicateCount, 0)
  assert.equal(result.rejectedCount, 0)
  assert.equal(observation.edge_request_id, edgeRequestId)
  assert.equal(observation.route_pathname, '/skreddersy-varmen')
  assert.equal(observation.referrer_host, 'l.facebook.com')
  assert.equal(observation.in_app_browser, 'facebook')
  assert.equal(observation.device_class, 'mobile')
  assert.equal(observation.os_class, 'ios')
  assert.equal(observation.automation_class, 'human_or_unknown')
  assert.equal(observation.fbclid_present, true)
  assert.equal(
    observation.fbclid_hmac,
    await computeHmacHex(
      fbclid,
      config.fbclidHmacSecret!,
      'SHA-256'
    )
  )
  assert.equal(observation.meta_ad_id, '120246491016410788')
  assert.equal(observation.trace_id, traceId.toLowerCase())
  assert.equal(
    observation.meta_campaign_id,
    '120246491016410700'
  )
  assert.equal(
    observation.meta_placement,
    'Facebook_Mobile_Feed'
  )

  const serialized = JSON.stringify(observation)
  assert.equal(serialized.includes(fbclid), false)
  assert.equal(serialized.includes('192.0.2.10'), false)
  assert.equal(serialized.includes('Mozilla/5.0'), false)
  assert.equal(serialized.includes('?'), false)
})

test('parses edge_request_id only from the exact strict structured message', async () => {
  const variants = [
    validEntry({
      id: 'log-extra',
      message: `[landing-edge] {"edge_request_id":"${edgeRequestId}","extra":true}`
    }),
    validEntry({
      id: 'log-prefix',
      message: `prefix [landing-edge] {"edge_request_id":"${edgeRequestId}"}`
    }),
    validEntry({
      id: 'log-invalid',
      message: '[landing-edge] {"edge_request_id":"not-a-uuid"}'
    }),
    validEntry({
      id: 'log-valid',
      message: `[landing-edge] {"edge_request_id":"${edgeRequestId}"}`
    })
  ]

  const result = await sanitizeVercelLogBatch(variants, config)
  assert.deepEqual(
    result.observations.map(
      observation => observation.edge_request_id
    ),
    [null, null, null, edgeRequestId]
  )
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
    validEntry({ id: 'build', source: 'build' })
  ]

  const result = await sanitizeVercelLogBatch(values, config)
  assert.deepEqual(result.observations, [])
  assert.equal(result.rejectedCount, values.length)
})

test('normalizes Instagram Android, redirects and known automation classes', async () => {
  const baseProxy = validEntry().proxy as Record<string, unknown>
  const instagram = validEntry({
    id: 'instagram',
    proxy: {
      ...baseProxy,
      path: '/comfyrobe',
      statusCode: 307,
      userAgent: [
        'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Instagram 390.0.0.0 Android'
      ]
    },
    source: 'redirect'
  })
  const bot = validEntry({
    id: 'bot',
    proxy: {
      ...baseProxy,
      path: '/produkter/utekos-dun',
      userAgent: [
        'Googlebot/2.1 (+https://www.google.com/bot.html)'
      ]
    },
    source: 'firewall'
  })
  const synthetic = validEntry({
    id: 'synthetic',
    proxy: {
      ...baseProxy,
      path: '/produkter/utekos-techdown',
      userAgent: ['curl/8.12.1']
    }
  })

  const result = await sanitizeVercelLogBatch(
    [instagram, bot, synthetic],
    config
  )
  assert.equal(
    result.observations[0]?.in_app_browser,
    'instagram'
  )
  assert.equal(result.observations[0]?.os_class, 'android')
  assert.equal(
    result.observations[0]?.observation_type,
    'redirect'
  )
  assert.equal(
    result.observations[1]?.automation_class,
    'known_bot_user_agent'
  )
  assert.equal(result.observations[1]?.device_class, 'bot')
  assert.equal(
    result.observations[2]?.automation_class,
    'synthetic_client'
  )
})

test('deduplicates repeated Vercel log ids before the database write', async () => {
  const result = await sanitizeVercelLogBatch(
    [validEntry(), validEntry()],
    config
  )

  assert.equal(result.observations.length, 1)
  assert.equal(result.duplicateCount, 1)
  assert.equal(result.rejectedCount, 0)
})

test('uses only a numeric utm_content value as a guarded Meta ad id fallback', async () => {
  const baseProxy = validEntry().proxy as Record<string, unknown>
  const result = await sanitizeVercelLogBatch(
    [
      validEntry({
        id: 'numeric-utm-content',
        proxy: {
          ...baseProxy,
          path: '/skreddersy-varmen?utm_content=120246491016410788'
        }
      }),
      validEntry({
        id: 'descriptive-utm-content',
        proxy: {
          ...baseProxy,
          path: '/skreddersy-varmen?utm_content=warm-creative-a'
        }
      }),
      validEntry({
        id: 'explicit-ad-id-wins',
        proxy: {
          ...baseProxy,
          path: '/skreddersy-varmen?ad_id=120246491016410700&utm_content=120246491016410788'
        }
      })
    ],
    config
  )

  assert.deepEqual(
    result.observations.map(observation => ({
      metaAdId: observation.meta_ad_id,
      utmContent: observation.utm_content
    })),
    [
      {
        metaAdId: '120246491016410788',
        utmContent: '120246491016410788'
      },
      { metaAdId: null, utmContent: 'warm-creative-a' },
      {
        metaAdId: '120246491016410700',
        utmContent: '120246491016410788'
      }
    ]
  )
})
