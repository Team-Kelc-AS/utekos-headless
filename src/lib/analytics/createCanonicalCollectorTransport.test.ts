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
      { consent: deniedConsent }
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
      { consent: deniedConsent, event_name: 'web_vital' }
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
    { consent: deniedConsent, event_name: 'web_vital' }
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
      { consent: deniedConsent, event_name: 'web_vital' }
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
