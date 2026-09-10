import assert from 'node:assert/strict'
import test from 'node:test'
import type { ProvisionalPageViewCaptureStore } from './provisionalPageViewCaptureStore'
import { handleProvisionalPageViewCaptureRequest } from './handleProvisionalPageViewCaptureRequest'

const endpoint = 'https://utekos.no/api/events/page-view/capture'

function captureBody() {
  return {
    capture_state: 'pending' as const,
    event: {
      schema_version: 1,
      event_name: 'page_view',
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
      edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd',
      event_time: '2026-08-23T21:00:00.000Z',
      source: 'web',
      environment: 'test',
      page_url:
        'https://utekos.no/?fbclid=meta-click&utm_source=facebook',
      page_title: 'Utekos',
      consent: {
        analytics: 'denied',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      click_id: { fbclid: 'meta-click' }
    }
  }
}

function request(
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new Request(endpoint, {
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'origin': 'https://utekos.no',
      ...headers
    },
    method: 'POST'
  })
}

function store(
  capture: ProvisionalPageViewCaptureStore['capture']
): ProvisionalPageViewCaptureStore {
  return { capture, release: async () => undefined }
}

test('pending and denied capture are rejected without storing or logging event payloads', async () => {
  let writes = 0,
    logs = 0
  const original = console.info
  console.info = () => {
    logs++
  }
  try {
    for (const state of ['pending', 'denied', 'granted']) {
      const response =
        await handleProvisionalPageViewCaptureRequest(
          request({ ...captureBody(), capture_state: state }),
          store(async () => {
            writes++
            return 'inserted'
          })
        )
      assert.equal(response.status, 403)
      assert.deepEqual(await response.json(), {
        error: 'consent_required'
      })
    }
    assert.equal(writes, 0)
    assert.equal(logs, 0)
  } finally {
    console.info = original
  }
})

test('statistics-only capture strips marketing data and edge correlation', async () => {
  const body = captureBody()
  body.event.consent.analytics = 'granted'
  const writes: Array<
    Parameters<ProvisionalPageViewCaptureStore['capture']>[0]
  > = []
  const response = await handleProvisionalPageViewCaptureRequest(
    request({ ...body, capture_state: 'granted' }),
    store(async data => {
      writes.push(data)
      return 'inserted'
    })
  )
  assert.equal(response.status, 202)
  assert.equal(writes[0]?.event.click_id, undefined)
  assert.equal(writes[0]?.event.edge_request_id, undefined)
  assert.equal(writes[0]?.event.page_url, 'https://utekos.no/')
})

test('never accepts a cross-origin capture', async () => {
  let writes = 0
  const response = await handleProvisionalPageViewCaptureRequest(
    request(captureBody(), { origin: 'https://example.com' }),
    store(async () => {
      writes += 1
      return 'inserted'
    })
  )

  assert.equal(response.status, 403)
  assert.equal(writes, 0)
})

test('rejects malformed capture payloads', async () => {
  const response = await handleProvisionalPageViewCaptureRequest(
    request({ capture_state: 'pending', event: {} }),
    store(async () => 'inserted')
  )

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'invalid_capture'
  })
})

test('redacts storage failures', async () => {
  const originalError = console.error
  console.error = () => undefined

  try {
    const response =
      await handleProvisionalPageViewCaptureRequest(
        request({
          ...captureBody(),
          capture_state: 'granted',
          event: {
            ...captureBody().event,
            consent: {
              ...captureBody().event.consent,
              marketing: 'granted'
            }
          }
        }),
        store(async () => {
          throw new Error('database credentials')
        })
      )

    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), {
      error: 'internal_error'
    })
  } finally {
    console.error = originalError
  }
})
