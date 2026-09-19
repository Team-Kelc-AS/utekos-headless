import assert from 'node:assert/strict'
import test from 'node:test'
import { enrichBrowserMetaAudience } from './browserMetaAudience'
import {
  createCheckoutAttributionSnapshot,
  checkoutAttributionSnapshotToShopifyAttributes
} from './checkoutAttributionSnapshot'
import { prepareCanonicalPageViewForCollector } from './pageViewCollectorTransport'
import { createCanonicalPageView } from './pageViewEvent'

test('granted consent gates navigation, delayed events and checkout', () => {
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  )
  const data = new Map<string, string>()
  const host = {
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
    addEventListener: () => {}
  }
  const consent = {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  } as const
  const denied = {
    ...consent,
    analytics: 'denied' as const,
    marketing: 'denied' as const
  }
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
    assert.equal(
      enrichBrowserMetaAudience({ consent: denied })
        .meta_audience,
      undefined
    )
    assert.equal(
      enrichBrowserMetaAudience({ consent }).meta_audience,
      'existing_customers'
    )
  } finally {
    if (previous)
      Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('PageView final preparation removes a segment after either purpose is withdrawn', () => {
  const granted = createCanonicalPageView({
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
  })
  for (const consent of [
    {
      analytics: 'denied' as const,
      marketing: 'granted' as const,
      preferences: 'denied' as const,
      source: 'cookiebot' as const,
      version: '1'
    },
    {
      analytics: 'granted' as const,
      marketing: 'denied' as const,
      preferences: 'denied' as const,
      source: 'cookiebot' as const,
      version: '1'
    }
  ]) {
    assert.equal(
      prepareCanonicalPageViewForCollector(
        {
          ...granted,
          consent,
          meta_audience: 'engaged_audience'
        },
        {},
        ''
      ).meta_audience,
      undefined
    )
  }
})
