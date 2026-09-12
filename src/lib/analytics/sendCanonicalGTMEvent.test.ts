import assert from 'node:assert/strict'
import test from 'node:test'
import { sendCanonicalGTMEvent } from './sendCanonicalGTMEvent'
import {
  buildPageViewDataLayerEvent,
  createCanonicalPageView
} from './pageViewEvent'

test('GTM receives the same canonical ID and explicit null after audience withdrawal', () => {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  )
  const data = new Map<string, string>()
  const host = {
    dataLayer: [] as Array<Record<string, unknown>>,
    location: {
      href: 'https://utekos.no/?audience=engaged_audience'
    },
    Cookiebot: {
      hasResponse: true,
      consent: {
        method: 'explicit',
        statistics: true,
        marketing: true
      }
    },
    sessionStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value)
      },
      removeItem: (key: string) => {
        data.delete(key)
      }
    },
    addEventListener: () => {}
  }
  Object.defineProperty(globalThis, 'window', {
    value: host,
    configurable: true
  })
  try {
    const event = createCanonicalPageView({
      environment: 'test',
      eventId: crypto.randomUUID(),
      pageViewId: crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageUrl: host.location.href,
      pageTitle: 'Utekos',
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
    })
    sendCanonicalGTMEvent(buildPageViewDataLayerEvent(event))
    assert.equal(host.dataLayer.length, 1)
    assert.equal(
      host.dataLayer[0]?.meta_audience,
      'engaged_audience'
    )
    assert.equal(host.dataLayer[0]?.event_id, event.event_id)
    assert.deepEqual(host.dataLayer[0]?.canonical_event, {
      ...event,
      meta_audience: 'engaged_audience'
    })
    assert.equal(event.meta_audience, undefined)
    host.Cookiebot.consent.marketing = false
    sendCanonicalGTMEvent(buildPageViewDataLayerEvent(event))
    assert.equal(host.dataLayer.length, 2)
    assert.equal(host.dataLayer[1]?.meta_audience, null)
    assert.deepEqual(host.dataLayer[1]?.canonical_event, event)
  } finally {
    if (previous)
      Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
