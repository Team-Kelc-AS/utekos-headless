import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPageViewStore } from './acceptCanonicalPageView'
import { handleCanonicalPageViewRequest } from './handleCanonicalPageViewRequest'

const endpoint = 'https://utekos.no/api/events/page-view'
const insertedAcceptance = {
  createdDispatchAttempts: [],
  status: 'inserted' as const
}
const duplicateAcceptance = {
  createdDispatchAttempts: [],
  status: 'duplicate' as const
}

function pageView(
  analytics: 'denied' | 'granted' = 'granted',
  marketing: 'denied' | 'granted' = 'denied'
) {
  return {
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-15T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/',
    page_title: 'Utekos',
    consent: {
      analytics,
      marketing,
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    }
  }
}

function request(
  body: string,
  headers: Record<string, string> = {}
) {
  return new Request(endpoint, {
    body,
    headers: {
      'content-type': 'application/json',
      origin: 'https://utekos.no',
      ...headers
    },
    method: 'POST'
  })
}

function dependencies(
  accept: CanonicalPageViewStore['accept'] = async () =>
    insertedAcceptance
) {
  return {
    getRequestContext: () => ({
      clientIpAddress: '203.0.113.10',
      countryCode: 'NO',
      userAgent: 'test-agent'
    }),
    store: { accept }
  }
}

test('rejects a request from another origin', async () => {
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView()), {
      origin: 'https://example.com'
    }),
    dependencies()
  )

  assert.equal(response.status, 403)
  assert.match(response.headers.get('cache-control') ?? '', /no-store/)
})

test('requires a JSON media type', async () => {
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView()), {
      'content-type': 'text/plain'
    }),
    dependencies()
  )

  assert.equal(response.status, 415)
})

test('rejects a payload larger than 32 KiB', async () => {
  const response = await handleCanonicalPageViewRequest(
    request('x'.repeat(32 * 1024 + 1)),
    dependencies()
  )

  assert.equal(response.status, 413)
})

test('returns a validation error for a non-canonical event', async () => {
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify({ event_name: 'page_view' })),
    dependencies()
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_event'
  })
})

test('does not persist a fully denied event', async () => {
  let writes = 0
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView('denied', 'denied'))),
    dependencies(async () => {
      writes += 1
      return insertedAcceptance
    })
  )

  assert.equal(response.status, 204)
  assert.equal(writes, 0)
})

test('returns accepted after atomic persistence', async () => {
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView())),
    dependencies()
  )

  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), {
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    status: 'accepted'
  })
})

test('returns an idempotent duplicate response', async () => {
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView())),
    dependencies(async () => duplicateAcceptance)
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    status: 'duplicate'
  })
})

test('redacts persistence failures', async () => {
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView())),
    dependencies(async () => {
      throw new Error('database credentials')
    })
  )

  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {
    error: 'internal_error'
  })
})
