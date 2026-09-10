import assert from 'node:assert/strict'
import test from 'node:test'
import { applyCanonicalCollectionContext } from './applyCanonicalCollectionContext'
import { sendCanonicalCollectorEvent } from './createCanonicalCollectorTransport'

const deniedConsent = {
  analytics: 'denied' as const,
  marketing: 'denied' as const,
  preferences: 'denied' as const,
  source: 'cookiebot' as const,
  version: '1'
}

const experiment = {
  key: 'skreddersy-varmen-layout-v1' as const,
  variant: 'legacy' as const
}

test('adds the experiment only to analytics-consented collection', () => {
  const event = {
    consent: deniedConsent,
    event_name: 'add_to_cart',
    experiment
  }

  const granted = applyCanonicalCollectionContext(event, {
    consent: { ...deniedConsent, analytics: 'granted' },
    experiment,
    hasResponse: true
  })
  const denied = applyCanonicalCollectionContext(event, {
    consent: deniedConsent,
    experiment,
    hasResponse: true
  })

  assert.deepEqual(granted.experiment, experiment)
  assert.equal(denied.experiment, undefined)
})

test('uses a neutral fallback after a network-level collector failure', async () => {
  const originalFetch = globalThis.fetch
  const requestedEndpoints: string[] = []

  globalThis.fetch = async input => {
    requestedEndpoints.push(String(input))

    if (requestedEndpoints.length === 1) {
      throw new TypeError('Failed to fetch')
    }

    return new Response(null, { status: 202 })
  }

  try {
    await sendCanonicalCollectorEvent(
      {
        analyticsEventName: 'view_promotion',
        endpoint: '/api/events/view-promotion',
        fallbackEndpoint: '/api/e/vp'
      },
      {
        consent: {
          ...deniedConsent,
          analytics: 'granted' as const
        }
      }
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  assert.deepEqual(requestedEndpoints, [
    '/api/events/view-promotion',
    '/api/e/vp'
  ])
})

test('queues web vitals on the neutral beacon endpoint when available', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator'
  )
  const originalFetch = globalThis.fetch
  const beacons: Array<{ body: Blob; url: string }> = []
  let fetchCalls = 0

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      sendBeacon: (
        url: string | URL,
        data?: BodyInit | null
      ) => {
        assert.ok(data instanceof Blob)
        beacons.push({ body: data, url: String(url) })
        return true
      }
    }
  })
  globalThis.fetch = async () => {
    fetchCalls += 1
    return new Response(null, { status: 202 })
  }

  try {
    await sendCanonicalCollectorEvent(
      {
        analyticsEventName: 'web_vital',
        beaconEndpoint: '/api/e/wv',
        endpoint: '/api/events/web-vital',
        fallbackEndpoint: '/api/e/wv'
      },
      {
        consent: {
          ...deniedConsent,
          analytics: 'granted' as const
        },
        event_name: 'web_vital'
      }
    )
  } finally {
    globalThis.fetch = originalFetch
    if (originalNavigator) {
      Object.defineProperty(
        globalThis,
        'navigator',
        originalNavigator
      )
    } else {
      Reflect.deleteProperty(globalThis, 'navigator')
    }
  }

  assert.equal(fetchCalls, 0)
  assert.equal(beacons.length, 1)
  assert.equal(beacons[0]?.url, '/api/e/wv')
  assert.equal(beacons[0]?.body.type, 'application/json')
  assert.deepEqual(
    JSON.parse((await beacons[0]?.body.text()) ?? '{}'),
    {
      consent: {
        ...deniedConsent,
        analytics: 'granted' as const
      },
      event_name: 'web_vital'
    }
  )
})

test('falls back to fetch when the beacon cannot queue the event', async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator'
  )
  const originalFetch = globalThis.fetch
  const requestedEndpoints: string[] = []

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { sendBeacon: () => false }
  })
  globalThis.fetch = async input => {
    requestedEndpoints.push(String(input))
    return new Response(null, { status: 202 })
  }

  try {
    await sendCanonicalCollectorEvent(
      {
        analyticsEventName: 'web_vital',
        beaconEndpoint: '/api/e/wv',
        endpoint: '/api/events/web-vital',
        fallbackEndpoint: '/api/e/wv'
      },
      {
        consent: {
          ...deniedConsent,
          analytics: 'granted' as const
        },
        event_name: 'web_vital'
      }
    )
  } finally {
    globalThis.fetch = originalFetch
    if (originalNavigator) {
      Object.defineProperty(
        globalThis,
        'navigator',
        originalNavigator
      )
    } else {
      Reflect.deleteProperty(globalThis, 'navigator')
    }
  }

  assert.deepEqual(requestedEndpoints, ['/api/events/web-vital'])
})

test('escapes a saturated keepalive queue while the page is visible without changing the event', async t => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  )
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { visibilityState: 'visible' }
  })
  t.after(() => {
    if (originalDocument)
      Object.defineProperty(
        globalThis,
        'document',
        originalDocument
      )
    else Reflect.deleteProperty(globalThis, 'document')
  })
  const requests: Array<{ path: string; init: RequestInit }> = []
  t.mock.method(
    globalThis,
    'fetch',
    async (path: string, init: RequestInit) => {
      requests.push({ path, init })
      if (init.keepalive) throw new TypeError('Failed to fetch')
      return new Response(null, { status: 202 })
    }
  )
  const event = {
    consent: { ...deniedConsent, analytics: 'granted' as const },
    event_id: 'same-event',
    page_url: 'https://utekos.no/skreddersy-varmen'
  }

  await sendCanonicalCollectorEvent(
    {
      analyticsEventName: 'view_promotion',
      endpoint: '/api/events/view-promotion',
      fallbackEndpoint: '/api/e/vp'
    },
    event
  )

  assert.equal(requests.length, 2)
  assert.equal(requests[0]?.init.keepalive, true)
  assert.equal(requests[1]?.init.keepalive, false)
  assert.equal(requests[1]?.path, '/api/e/vp')
  assert.equal(requests[0]?.init.body, requests[1]?.init.body)
  assert.deepEqual(
    JSON.parse(String(requests[1]?.init.body)),
    event
  )
})

test('keeps unload protection for retries in a hidden page and reports safe failure context', async t => {
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  )
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { visibilityState: 'hidden' }
  })
  t.after(() => {
    if (originalDocument)
      Object.defineProperty(
        globalThis,
        'document',
        originalDocument
      )
    else Reflect.deleteProperty(globalThis, 'document')
  })
  let attempts = 0
  t.mock.method(
    globalThis,
    'fetch',
    async (_path: string, init: RequestInit) => {
      attempts += 1
      assert.equal(init.keepalive, true)
      throw new TypeError(
        'Failed to fetch https://secret.example/?private=do-not-log'
      )
    }
  )
  await assert.rejects(
    sendCanonicalCollectorEvent(
      {
        analyticsEventName: 'view_promotion',
        endpoint: '/api/events/view-promotion',
        fallbackEndpoint: '/api/e/vp?private=do-not-log'
      },
      {
        consent: {
          ...deniedConsent,
          analytics: 'granted' as const
        }
      }
    ),
    error => {
      assert.ok(error instanceof Error)
      assert.match(error.message, /stage=request/)
      assert.match(error.message, /path=\/api\/e\/vp /)
      assert.match(error.message, /attempt=2/)
      assert.match(error.message, /visibility=hidden/)
      assert.doesNotMatch(
        error.message,
        /private|secret|do-not-log/
      )
      return true
    }
  )
  assert.equal(attempts, 2)
})

test('distinguishes preparation failures from requests without sending the event', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1
    return new Response(null, { status: 202 })
  })
  await assert.rejects(
    sendCanonicalCollectorEvent(
      {
        analyticsEventName: 'web_vital',
        endpoint: '/api/events/web-vital',
        enrichEvent: async () => {
          throw new TypeError('Failed to fetch')
        }
      },
      {
        consent: {
          ...deniedConsent,
          analytics: 'granted' as const
        }
      }
    ),
    /stage=event_enrichment/
  )
  assert.equal(calls, 0)
})

test('does not retry a rejected event contract', async t => {
  let calls = 0
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1
    return new Response(null, { status: 400 })
  })
  await assert.rejects(
    sendCanonicalCollectorEvent(
      {
        analyticsEventName: 'view_promotion',
        endpoint: '/api/events/view-promotion'
      },
      {
        consent: {
          ...deniedConsent,
          analytics: 'granted' as const
        }
      }
    ),
    /status=400/
  )
  assert.equal(calls, 1)
})

test('preserves keepalive on a retryable HTTP response and stops after success', async t => {
  const requests: RequestInit[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (_path: string, init: RequestInit) => {
      requests.push(init)
      return new Response(null, {
        status: requests.length === 1 ? 503 : 202
      })
    }
  )
  await sendCanonicalCollectorEvent(
    {
      analyticsEventName: 'view_promotion',
      endpoint: '/api/events/view-promotion'
    },
    {
      consent: {
        ...deniedConsent,
        analytics: 'granted' as const
      }
    }
  )
  assert.equal(requests.length, 2)
  assert.ok(requests.every(request => request.keepalive))
})

test('recovers a rejected web vital beacon when the shared keepalive budget is full', async t => {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator'
  )
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    'document'
  )
  let beacons = 0
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      sendBeacon: () => {
        beacons += 1
        return false
      }
    }
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { visibilityState: 'visible' }
  })
  t.after(() => {
    if (originalNavigator)
      Object.defineProperty(
        globalThis,
        'navigator',
        originalNavigator
      )
    else Reflect.deleteProperty(globalThis, 'navigator')
    if (originalDocument)
      Object.defineProperty(
        globalThis,
        'document',
        originalDocument
      )
    else Reflect.deleteProperty(globalThis, 'document')
  })
  const received: string[] = []
  t.mock.method(
    globalThis,
    'fetch',
    async (_path: string, init: RequestInit) => {
      if (init.keepalive) throw new TypeError('Failed to fetch')
      received.push(String(init.body))
      return new Response(null, { status: 202 })
    }
  )
  await sendCanonicalCollectorEvent(
    {
      analyticsEventName: 'web_vital',
      beaconEndpoint: '/api/e/wv',
      endpoint: '/api/events/web-vital',
      fallbackEndpoint: '/api/e/wv'
    },
    {
      consent: {
        ...deniedConsent,
        analytics: 'granted' as const
      },
      event_id: 'same-web-vital'
    }
  )
  assert.equal(beacons, 1)
  assert.equal(received.length, 1)
  assert.equal(
    JSON.parse(received[0]!).event_id,
    'same-web-vital'
  )
})

test('measures UTF-8 bytes and avoids keepalive for a body above 64 KiB', async t => {
  const event = {
    consent: { ...deniedConsent, analytics: 'granted' as const },
    data: 'å'.repeat(33_000)
  }
  let attempts = 0
  t.mock.method(
    globalThis,
    'fetch',
    async (_path: string, init: RequestInit) => {
      attempts += 1
      assert.equal(init.keepalive, false)
      assert.ok(new Blob([String(init.body)]).size > 65_536)
      assert.deepEqual(JSON.parse(String(init.body)), event)
      return new Response(null, { status: 202 })
    }
  )
  await sendCanonicalCollectorEvent(
    {
      analyticsEventName: 'web_vital',
      endpoint: '/api/events/web-vital'
    },
    event
  )
  assert.equal(attempts, 1)
})
