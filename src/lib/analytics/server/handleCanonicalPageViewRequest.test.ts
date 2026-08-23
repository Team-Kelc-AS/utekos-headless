import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPageViewStore } from './acceptCanonicalPageView'
import { handleCanonicalPageViewRequest } from './handleCanonicalPageViewRequest'
import type { PageViewFunnelObservationIdentity } from './pageViewFunnelObservationStore'

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
      'origin': 'https://utekos.no',
      ...headers
    },
    method: 'POST'
  })
}

function dependencies(
  accept: CanonicalPageViewStore['accept'] = async () =>
    insertedAcceptance,
  scheduleCollectorReceipt?: (
    identity: PageViewFunnelObservationIdentity
  ) => void
) {
  return {
    getRequestContext: () => ({
      clientIpAddress: '203.0.113.10',
      countryCode: 'NO',
      userAgent: 'test-agent'
    }),
    ...(scheduleCollectorReceipt ?
      { scheduleCollectorReceipt }
    : {}),
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
  assert.match(
    response.headers.get('cache-control') ?? '',
    /no-store/
  )
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

test('releases the provisional row only after canonical acceptance', async () => {
  const releasedEventIds: string[] = []
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView())),
    {
      ...dependencies(),
      provisionalStore: {
        release: async eventId => {
          releasedEventIds.push(eventId)
        }
      }
    }
  )

  assert.equal(response.status, 202)
  assert.deepEqual(releasedEventIds, [
    '61c2ef59-6e6f-4f56-a63a-567ca398f9de'
  ])
})

test('keeps a denied provisional row for bounded diagnostics', async () => {
  let releases = 0
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(pageView('denied', 'denied'))),
    {
      ...dependencies(),
      provisionalStore: {
        release: async () => {
          releases += 1
        }
      }
    }
  )

  assert.equal(response.status, 204)
  assert.equal(releases, 0)
})

test('schedules collector receipt before canonical acceptance', async () => {
  const order: string[] = []
  const receipts: PageViewFunnelObservationIdentity[] = []
  const payload = {
    ...pageView(),
    edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
  }
  const response = await handleCanonicalPageViewRequest(
    request(JSON.stringify(payload)),
    dependencies(
      async () => {
        order.push('canonical_acceptance')
        return insertedAcceptance
      },
      identity => {
        order.push('collector_receipt')
        receipts.push(identity)
      }
    )
  )

  assert.equal(response.status, 202)
  assert.deepEqual(order, [
    'collector_receipt',
    'canonical_acceptance'
  ])
  assert.match(
    receipts[0]?.observedAt ?? '',
    /^\d{4}-\d{2}-\d{2}T/u
  )
  assert.deepEqual(receipts, [
    {
      edgeRequestId: payload.edge_request_id,
      eventId: payload.event_id,
      observedAt: receipts[0]?.observedAt,
      pageViewId: payload.page_view_id
    }
  ])
})

test('collector acceptance continues when receipt scheduling fails', async () => {
  let accepts = 0
  const originalWarn = console.warn
  console.warn = () => undefined

  try {
    const response = await handleCanonicalPageViewRequest(
      request(
        JSON.stringify({
          ...pageView(),
          edge_request_id: '47fc9196-2afa-4aaa-beb8-6c1e98a0d0bd'
        })
      ),
      dependencies(
        async () => {
          accepts += 1
          return insertedAcceptance
        },
        () => {
          throw new Error('receipt scheduler unavailable')
        }
      )
    )

    assert.equal(response.status, 202)
    assert.equal(accepts, 1)
  } finally {
    console.warn = originalWarn
  }
})

test('redacts PageView queries from logs without changing the persisted payload', async () => {
  const pageUrl =
    'https://utekos.no/skreddersy-varmen?fbclid=AbC-123&utm_source=facebook#bestill'
  const logCalls: unknown[][] = []
  let persistedPageUrl: string | undefined
  const originalConsoleInfo = console.info

  console.info = (...args: unknown[]) => {
    logCalls.push(args)
  }

  try {
    const response = await handleCanonicalPageViewRequest(
      request(
        JSON.stringify({ ...pageView(), page_url: pageUrl })
      ),
      dependencies(async input => {
        persistedPageUrl = input.event.page_url
        return insertedAcceptance
      })
    )

    assert.equal(response.status, 202)
  } finally {
    console.info = originalConsoleInfo
  }

  assert.equal(persistedPageUrl, pageUrl)

  const serializedLogs = JSON.stringify(logCalls)
  assert.match(
    serializedLogs,
    /https:\/\/utekos\.no\/skreddersy-varmen/
  )
  assert.doesNotMatch(
    serializedLogs,
    /fbclid|utm_source|bestill/
  )
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
