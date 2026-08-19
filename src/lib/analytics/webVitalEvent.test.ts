import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
import { gaWebVitalIntegerValue } from './gaWebVitalIntegerValue'
import {
  buildWebVitalCustomData,
  buildWebVitalDataLayerEvent,
  canonicalWebVitalCustomDataSchema,
  createCanonicalWebVital
} from './webVitalEvent'

test('custom_data keeps the raw float and a derived GA integer', () => {
  const customData = buildWebVitalCustomData({
    delta: 0.12,
    entries: [],
    metricId: 'v4-lcp-1',
    name: 'CLS',
    pathname: '/',
    rating: 'needs-improvement',
    value: 0.12
  })

  assert.equal(customData.value, 0.12)
  assert.equal(customData.ga_integer_value, 120)
  assert.equal(gaWebVitalIntegerValue('LCP', 2501.4), 2501)
  assert.doesNotThrow(() =>
    canonicalWebVitalCustomDataSchema.parse(customData)
  )
})

test('createCanonicalWebVital and dataLayer expose provider-neutral web_vital fields', () => {
  const event = createCanonicalWebVital({
    environment: 'production',
    eventId: '72b6c4d3-cf47-493b-844c-147e237fcf45',
    eventTime: '2026-08-19T00:00:00.000Z',
    pageUrl: 'https://utekos.no/produkter',
    pageTitle: 'Produkter | Utekos',
    pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
    consent: {
      analytics: 'granted',
      marketing: 'denied',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    customData: buildWebVitalCustomData({
      attribution: { element: 'h1' },
      delta: 2410,
      entries: [{ name: 'largest-contentful-paint' }],
      metricId: 'v4-123',
      name: 'LCP',
      navigationType: 'navigate',
      pathname: '/produkter',
      rating: 'good',
      value: 2410
    })
  })

  assert.equal(event.event_name, 'web_vital')
  assert.equal(event.custom_data.name, 'LCP')
  assert.equal(event.custom_data.metric_id, 'v4-123')
  assert.equal(event.custom_data.value, 2410)

  const dataLayer = buildWebVitalDataLayerEvent(event)
  assert.equal(dataLayer.event, 'web_vital')
  assert.equal(dataLayer.event_id, event.event_id)
  assert.equal(dataLayer.id, 'v4-123')
  assert.equal(dataLayer.name, 'LCP')
  assert.equal(dataLayer.value, 2410)
  assert.equal(dataLayer.delta, 2410)
  assert.equal(dataLayer.rating, 'good')
  assert.equal(dataLayer.navigationType, 'navigate')
  assert.equal(dataLayer.pathname, '/produkter')
  assert.deepEqual(dataLayer.attribution, { element: 'h1' })
  assert.equal(dataLayer.custom_data.ga_integer_value, 2410)
})

test('strictObject rejects unknown custom_data keys and Zod 4 format fields fail via issues', () => {
  assert.throws(
    () =>
      canonicalWebVitalCustomDataSchema.parse({
        delta: 1,
        entries: [],
        ga_integer_value: 1,
        metric_id: 'v4-1',
        name: 'INP',
        pathname: '/',
        value: 1,
        extra: true
      }),
    (error: unknown) => {
      assert.equal(error instanceof z.ZodError, true)
      const issues = (error as z.ZodError).issues
      assert.ok(issues.length > 0)
      assert.ok(
        issues.some(issue => issue.code === 'unrecognized_keys')
      )
      return true
    }
  )

  assert.throws(() =>
    createCanonicalWebVital({
      environment: 'test',
      eventId: 'not-a-uuid',
      eventTime: '2026-08-19T00:00:00.000Z',
      pageUrl: 'https://utekos.no/',
      pageTitle: 'Utekos',
      pageViewId: '0c955d6b-5e9c-47d0-b304-046df7f4bf7f',
      consent: {
        analytics: 'granted',
        marketing: 'denied',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      customData: buildWebVitalCustomData({
        delta: 800,
        entries: [],
        metricId: 'v4-ttfb',
        name: 'TTFB',
        pathname: '/',
        value: 800
      })
    })
  )
})
