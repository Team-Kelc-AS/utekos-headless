import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleJourneyRequest,
  type JourneyRequestDependencies
} from './handleJourneyRequest'
import {
  journeyEventSchema,
  sanitizeJourneyPath
} from './contract'
import { createJourneyStore } from './createJourneyStore'

const sample = {
  schema_version: 1,
  event_name: 'utm_landing_page_view',
  event_id: '11111111-1111-4111-8111-111111111111',
  journey_id: '22222222-2222-4222-8222-222222222222',
  page_view_id: '33333333-3333-4333-8333-333333333333',
  occurred_at: '2026-09-06T12:00:00.000Z',
  page_path: '/skreddersy-varmen',
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  source: 'browser',
  environment: 'test',
  data: { utm_source: 'meta', utm_campaign: 'Høst Dun' }
}
const request = (
  body: unknown = sample,
  headers: Record<string, string> = {}
) =>
  new Request('https://utekos.no/api/observability/journey', {
    method: 'POST',
    headers: {
      'origin': 'https://utekos.no',
      'content-type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  })
const dependencies = (
  extra: Partial<JourneyRequestDependencies> = {}
): JourneyRequestDependencies => ({
  store: { accept: async () => 'persisted' },
  now: () => Date.parse('2026-09-06T12:01:00.000Z'),
  runtime: {
    environment: 'test',
    deploymentId: 'dpl_test',
    commitSha: 'abc'
  },
  classifyTraffic: async () => ({
    classification: 'human_or_unknown'
  }),
  log: () => {},
  ...extra
})

test('requires analytics and marketing for the advertising-linked journey and rejects undeclared data', async () => {
  for (const consent of [
    undefined,
    { ...sample.consent, analytics: 'denied' },
    {
      ...sample.consent,
      analytics: 'denied',
      marketing: 'granted'
    }
  ]) {
    const response = await handleJourneyRequest(
      request({ ...sample, consent }),
      dependencies({
        store: {
          accept: async () => {
            throw new Error('Must not persist')
          }
        }
      })
    )
    assert.equal(response.status, 400)
  }
  assert.equal(
    (await handleJourneyRequest(request(), dependencies()))
      .status,
    202
  )
  assert.equal(
    journeyEventSchema.safeParse({
      ...sample,
      email: 'private@example.no'
    }).success,
    false
  )
  assert.equal(
    journeyEventSchema.safeParse({
      ...sample,
      data: { utm_source: 'private@example.no' }
    }).success,
    false
  )
  assert.equal(
    journeyEventSchema.safeParse({
      ...sample,
      data: { utm_source: '123456789' }
    }).success,
    false
  )
})

test('statistics-only legacy advertising-journey requests are rejected before storage or logs', async () => {
  let writes = 0,
    logs = 0
  const response = await handleJourneyRequest(
    request({
      ...sample,
      consent: { ...sample.consent, marketing: 'denied' }
    }),
    dependencies({
      store: {
        accept: async () => {
          writes++
          return 'persisted'
        }
      },
      log: () => {
        logs++
      }
    })
  )
  assert.equal(response.status, 403)
  assert.equal(writes, 0)
  assert.equal(logs, 0)
})

test('sanitizes links and rejects raw paths, ad identifiers, and non-landing UTM events', () => {
  assert.equal(
    sanitizeJourneyPath(
      '/produkter/utekos-dun?fbclid=secret#details'
    ),
    '/produkter/:dynamic'
  )
  assert.equal(
    sanitizeJourneyPath('/checkout/rawCheckoutToken'),
    '/:private'
  )
  assert.equal(
    sanitizeJourneyPath('/kunde/person%40example.no'),
    '/:private'
  )
  assert.equal(sanitizeJourneyPath('/:private'), '/:private')
  assert.equal(
    journeyEventSchema.safeParse({
      ...sample,
      page_path: '/produkter/utekos-dun'
    }).success,
    false
  )
  assert.equal(
    journeyEventSchema.safeParse({
      ...sample,
      page_path: '/skreddersy-varmen?fbclid=secret'
    }).success,
    false
  )
  assert.equal(
    journeyEventSchema.safeParse({
      ...sample,
      event_name: 'internal_link_click',
      data: {
        link_id: 'hero-product',
        target_path: '/checkout/token',
        navigation_type: 'same_tab'
      }
    }).success,
    false
  )
})

test('enforces origin, JSON, byte limit, timestamps and malformed bodies before storage', async () => {
  assert.equal(
    (
      await handleJourneyRequest(
        request(sample, { origin: 'https://evil.no' }),
        dependencies()
      )
    ).status,
    403
  )
  assert.equal(
    (
      await handleJourneyRequest(
        request(sample, { 'sec-fetch-site': 'cross-site' }),
        dependencies()
      )
    ).status,
    403
  )
  assert.equal(
    (
      await handleJourneyRequest(
        request(sample, { 'content-type': 'text/plain' }),
        dependencies()
      )
    ).status,
    415
  )
  assert.equal(
    (
      await handleJourneyRequest(
        request('x'.repeat(9000)),
        dependencies()
      )
    ).status,
    413
  )
  assert.equal(
    (
      await handleJourneyRequest(
        request(sample, { 'content-length': '9000' }),
        dependencies()
      )
    ).status,
    413
  )
  assert.equal(
    (
      await handleJourneyRequest(
        request({
          ...sample,
          occurred_at: '2026-09-08T12:00:00Z'
        }),
        dependencies()
      )
    ).status,
    400
  )
  const malformed = new Request(
    'https://utekos.no/api/observability/journey',
    {
      method: 'POST',
      headers: {
        'origin': 'https://utekos.no',
        'content-type': 'application/json'
      },
      body: '{'
    }
  )
  assert.equal(
    (await handleJourneyRequest(malformed, dependencies()))
      .status,
    400
  )
})

test('records accepted, duplicate, conflict and failed storage distinctly with server runtime metadata', async () => {
  for (const [acceptance, code] of [
    ['persisted', 202],
    ['duplicate', 200],
    ['conflict', 409]
  ] as const) {
    const logs: unknown[] = []
    const response = await handleJourneyRequest(
      request(),
      dependencies({
        store: {
          accept: async row => {
            assert.equal(row.runtime.commitSha, 'abc')
            return acceptance
          }
        },
        classifyTraffic: async () => ({
          classification: 'synthetic'
        }),
        log: (row, status) => {
          logs.push([row.traffic_classification, status])
        }
      })
    )
    assert.equal(response.status, code)
    assert.deepEqual(logs, [['synthetic', acceptance]])
  }
  assert.equal(
    (
      await handleJourneyRequest(
        request(),
        dependencies({
          store: {
            accept: async () => {
              throw new Error('database-secret')
            }
          }
        })
      )
    ).status,
    503
  )
})

test('store retries use identical event ID and hash, never overwrite a conflicting payload', async () => {
  const rows = new Map<string, unknown>()
  const store = createJourneyStore(async (sql, values) => {
    const id = values[0] as string
    if (sql.includes('insert into')) {
      if (rows.has(id)) return []
      rows.set(id, values[10])
      return [{ event_id: id }]
    }
    return [{ identical: rows.get(id) === values[1] }]
  })
  const row = {
    event: journeyEventSchema.parse(sample),
    received_at: sample.occurred_at,
    traffic_classification: 'human_or_unknown' as const,
    runtime: {
      environment: 'test',
      deploymentId: null,
      commitSha: null
    }
  }
  assert.equal(await store.accept(row), 'persisted')
  assert.equal(
    await store.accept({
      ...row,
      received_at: '2026-09-06T12:00:02Z'
    }),
    'duplicate'
  )
  assert.equal(
    await store.accept({
      ...row,
      event: journeyEventSchema.parse({
        ...sample,
        data: { utm_source: 'different' }
      })
    }),
    'conflict'
  )
  assert.equal(rows.size, 1)
})
