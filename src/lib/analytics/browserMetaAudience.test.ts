import assert from 'node:assert/strict'
import test from 'node:test'
import { enrichBrowserMetaAudience } from './browserMetaAudience'
import {
  createCheckoutAttributionSnapshot,
  checkoutAttributionSnapshotToShopifyAttributes
} from './checkoutAttributionSnapshot'
import { prepareCanonicalPageViewForCollector } from './pageViewCollectorTransport'
import { createCanonicalPageView } from './pageViewEvent'

test('live explicit consent gates navigation, delayed events, checkout and withdrawal', () => {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  )
  const data = new Map<string, string>()
  const listeners = new Map<string, (() => void)[]>()
  const host = {
    Cookiebot: {
      hasResponse: true,
      consent: {
        method: 'explicit',
        statistics: true,
        marketing: true
      }
    },
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
    addEventListener: (name: string, listener: () => void) => {
      listeners.set(name, [
        ...(listeners.get(name) ?? []),
        listener
      ])
    }
  }
  const consent = {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  } as const
  Object.defineProperty(globalThis, 'window', {
    value: host,
    configurable: true
  })
  try {
    const original = {
      consent,
      page_url: host.location.href,
      event_id: 'same-event'
    }
    assert.equal(
      enrichBrowserMetaAudience(original).meta_audience,
      'engaged_audience'
    )
    assert.equal('meta_audience' in original, false)
    host.location.href =
      'https://utekos.no/produkter/utekos-techdown'
    const product = enrichBrowserMetaAudience({
      consent,
      page_url: host.location.href,
      event_id: 'same-event'
    })
    assert.equal(product.meta_audience, 'engaged_audience')
    assert.equal(product.event_id, 'same-event')
    const snapshot = createCheckoutAttributionSnapshot(product)
    assert.equal(
      checkoutAttributionSnapshotToShopifyAttributes(
        snapshot
      ).find(item => item.key === 'utekos_meta_audience')?.value,
      'engaged_audience'
    )
    host.location.href =
      'https://utekos.no/ny?audience=existing_customers'
    assert.equal(
      enrichBrowserMetaAudience(product).meta_audience,
      undefined
    )
    host.Cookiebot.consent.marketing = false
    for (const listener of listeners.get('CookiebotOnDecline') ??
      [])
      listener()
    assert.equal(data.size, 0)
    assert.equal(
      enrichBrowserMetaAudience({ consent }).meta_audience,
      undefined
    )
    host.Cookiebot.consent.marketing = true
    host.Cookiebot.hasResponse = false
    assert.equal(
      enrichBrowserMetaAudience({ consent }).meta_audience,
      undefined
    )
    host.Cookiebot.hasResponse = true
    host.Cookiebot.consent.method = 'implied'
    assert.equal(
      enrichBrowserMetaAudience({ consent }).meta_audience,
      undefined
    )
  } finally {
    if (previous)
      Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('PageView final preparation removes a segment after either purpose is withdrawn', () => {
  const event = {
    ...createCanonicalPageView({
      environment: 'test',
      eventId: crypto.randomUUID(),
      pageViewId: crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      pageUrl: 'https://utekos.no/',
      pageTitle: 'Utekos',
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      }
    }),
    meta_audience: 'engaged_audience' as const
  }
  for (const consent of [
    { statistics: false, marketing: true },
    { statistics: true, marketing: false }
  ]) {
    assert.equal(
      prepareCanonicalPageViewForCollector(
        event,
        {
          hasResponse: true,
          consent: { ...consent, method: 'explicit' }
        },
        ''
      ).meta_audience,
      undefined
    )
  }
})
