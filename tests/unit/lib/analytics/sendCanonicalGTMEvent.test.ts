import assert from 'node:assert/strict'
import test from 'node:test'
import { sendCanonicalGTMEvent } from '@/lib/analytics/sendCanonicalGTMEvent'
import {
  buildPageViewDataLayerEvent,
  createCanonicalPageView
} from '@/lib/analytics/pageViewEvent'

test('GTM receives the same canonical ID and explicit null after audience withdrawal', async () => {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  )
  const previousCustomEvent = Object.getOwnPropertyDescriptor(
    globalThis,
    'CustomEvent'
  )
  const data = new Map<string, string>()
  const dispatched: Array<{ detail: unknown; type: string }> = []
  const host = {
    dataLayer: [] as Array<Record<string, unknown>>,
    location: {
      href: 'https://utekos.no/?audience=engaged_audience'
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
    addEventListener: () => {},
    dispatchEvent: (event: { detail: unknown; type: string }) => {
      dispatched.push(event)
      return true
    }
  }
  Object.defineProperty(globalThis, 'window', {
    value: host,
    configurable: true
  })
  Object.defineProperty(globalThis, 'CustomEvent', {
    value: class {
      detail: unknown
      type: string

      constructor(type: string, init: { detail: unknown }) {
        this.type = type
        this.detail = init.detail
      }
    },
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
        preferences: 'granted',
        source: 'cookiebot',
        version: '1'
      }
    })
    await sendCanonicalGTMEvent(buildPageViewDataLayerEvent(event), async value => value)
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
    assert.equal(
      dispatched[0]?.type,
      'utekos:meta-canonical-browser-event'
    )
    assert.deepEqual(dispatched[0]?.detail, host.dataLayer[0])
    assert.equal(event.meta_audience, undefined)
    await sendCanonicalGTMEvent(
      buildPageViewDataLayerEvent({
        ...event,
        consent: {
          ...event.consent,
          marketing: 'denied'
        }
      }),
      async value => value
    )
    assert.equal(host.dataLayer.length, 2)
    assert.equal(host.dataLayer[1]?.meta_audience, null)
    assert.deepEqual(host.dataLayer[1]?.canonical_event, {
      ...event,
      consent: {
        ...event.consent,
        marketing: 'denied'
      }
    })
    const sending = sendCanonicalGTMEvent(
      buildPageViewDataLayerEvent(event),
      async value => ({ ...value, browser_id: { ga_client_id: '123.456', ga_session_id: '456' } })
    )
    assert.equal(dispatched.length, 3, 'Meta dispatch must precede async GA ID lookup')
    assert.equal(host.dataLayer.length, 2)
    await sending
    assert.deepEqual((host.dataLayer[2]?.canonical_event as typeof event).browser_id, {
      ga_client_id: '123.456', ga_session_id: '456'
    })
    assert.equal(host.dataLayer[2]?.event_id, event.event_id)
  } finally {
    if (previous)
      Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
    if (previousCustomEvent)
      Object.defineProperty(
        globalThis,
        'CustomEvent',
        previousCustomEvent
      )
    else Reflect.deleteProperty(globalThis, 'CustomEvent')
  }
})
