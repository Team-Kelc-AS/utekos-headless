import assert from 'node:assert/strict'
import test from 'node:test'
import type { MetaNonWebEventRequestDependencies } from './handleMetaNonWebEventRequest'
import { handleMetaNonWebEventRequest } from './handleMetaNonWebEventRequest'
import { MetaNonWebEventTimeError } from './normalizeMetaNonWebIngestEvent'

const eventTime = Math.floor(Date.now() / 1000)
const extinfo = [
  'i2',
  'no.utekos.app',
  '1.0',
  '100',
  '19.0',
  'iPhone17,1',
  'nb_NO',
  'CEST',
  '',
  1179,
  2556,
  '3',
  6,
  256,
  120,
  'Europe/Oslo'
] as const

const payload = {
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'app',
    version: 'app-consent-v1'
  },
  event: {
    advertiser_tracking_enabled: true,
    app_data: { application_tracking_enabled: true, extinfo },
    event_id: 'native-app-lead-1',
    event_name: 'Lead',
    event_time: eventTime,
    user_data: { external_id: 'observed-app-user-1' }
  },
  schema_version: 1,
  source_type: 'app'
}

function request(
  body: string = JSON.stringify(payload),
  headers: Record<string, string> = {}
) {
  return new Request(
    'https://utekos.no/api/meta/non-web-events',
    {
      body,
      headers: {
        'authorization': 'Bearer ingest-secret',
        'content-type': 'application/json',
        ...headers
      },
      method: 'POST'
    }
  )
}

function dependencies(
  overrides: Partial<MetaNonWebEventRequestDependencies> = {}
): MetaNonWebEventRequestDependencies {
  return {
    accept: async () => ({
      event_id: 'a03f5556-c610-451d-9d4d-9de20718d59f',
      status: 'accepted'
    }),
    getIngestSecret: () => 'ingest-secret',
    isSourceEnabled: () => true,
    ...overrides
  }
}

test('fails closed when the ingest secret is missing or authorization is invalid', async () => {
  const unconfigured = await handleMetaNonWebEventRequest(
    request(),
    dependencies({ getIngestSecret: () => undefined })
  )
  const unauthorized = await handleMetaNonWebEventRequest(
    request(JSON.stringify(payload), {
      authorization: 'Bearer incorrect'
    }),
    dependencies()
  )

  assert.equal(unconfigured.status, 503)
  assert.deepEqual(await unconfigured.json(), {
    error: 'ingest_not_configured'
  })
  assert.equal(unauthorized.status, 401)
  assert.deepEqual(await unauthorized.json(), {
    error: 'unauthorized'
  })
})

test('enforces JSON and a bounded request body', async () => {
  const mediaType = await handleMetaNonWebEventRequest(
    request('{}', { 'content-type': 'text/plain' }),
    dependencies()
  )
  const declaredTooLarge = await handleMetaNonWebEventRequest(
    request('{}', { 'content-length': String(65 * 1024) }),
    dependencies()
  )
  const actualTooLarge = await handleMetaNonWebEventRequest(
    request(JSON.stringify({ padding: 'x'.repeat(65 * 1024) })),
    dependencies()
  )

  assert.equal(mediaType.status, 415)
  assert.equal(declaredTooLarge.status, 413)
  assert.equal(actualTooLarge.status, 413)
})

test('rejects malformed input and independently disabled sources', async () => {
  const invalidJson = await handleMetaNonWebEventRequest(
    request('{'),
    dependencies()
  )
  const invalidEvent = await handleMetaNonWebEventRequest(
    request('{}'),
    dependencies()
  )
  const disabled = await handleMetaNonWebEventRequest(
    request(),
    dependencies({ isSourceEnabled: () => false })
  )

  assert.equal(invalidJson.status, 400)
  assert.equal(invalidEvent.status, 400)
  assert.equal(disabled.status, 503)
  assert.deepEqual(await disabled.json(), {
    error: 'source_disabled'
  })
})

test('returns accepted and duplicate outcomes without exposing source payloads', async () => {
  let acceptedPayload: unknown
  const accepted = await handleMetaNonWebEventRequest(
    request(),
    dependencies({
      accept: async input => {
        acceptedPayload = input.payload
        return {
          event_id: 'a03f5556-c610-451d-9d4d-9de20718d59f',
          status: 'accepted'
        }
      }
    })
  )
  const duplicate = await handleMetaNonWebEventRequest(
    request(),
    dependencies({
      accept: async () => ({
        event_id: 'a03f5556-c610-451d-9d4d-9de20718d59f',
        status: 'duplicate'
      })
    })
  )

  assert.equal(accepted.status, 202)
  assert.equal(duplicate.status, 200)
  assert.equal(
    accepted.headers.get('cache-control'),
    'no-store, max-age=0'
  )
  assert.deepEqual(acceptedPayload, payload)
  assert.deepEqual(await accepted.json(), {
    event_id: 'a03f5556-c610-451d-9d4d-9de20718d59f',
    status: 'accepted'
  })
})

test('classifies stale source timestamps and hides unexpected failures', async () => {
  const stale = await handleMetaNonWebEventRequest(
    request(),
    dependencies({
      accept: async () => {
        throw new MetaNonWebEventTimeError()
      }
    })
  )
  const failed = await handleMetaNonWebEventRequest(
    request(),
    dependencies({
      accept: async () => {
        throw new Error('sensitive internal failure')
      }
    })
  )

  assert.equal(stale.status, 422)
  assert.deepEqual(await stale.json(), {
    error: 'event_time_outside_window'
  })
  assert.equal(failed.status, 500)
  assert.deepEqual(await failed.json(), {
    error: 'ingest_failed'
  })
})
