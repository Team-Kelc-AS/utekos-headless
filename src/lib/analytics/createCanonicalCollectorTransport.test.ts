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
