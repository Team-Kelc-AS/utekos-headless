import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPageView } from '@/lib/analytics/pageViewEvent'
import { mapCanonicalPageViewToMeta } from '@/lib/analytics/server/mapCanonicalPageViewToMeta'

function pageView(): CanonicalPageView {
  return {
    schema_version: 1,
    event_name: 'page_view',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    page_view_id: 'e58460a4-5a60-450c-962a-7f22254c25dd',
    event_time: '2026-07-18T10:00:00.000Z',
    source: 'web',
    environment: 'test',
    page_url: 'https://utekos.no/kampanje',
    page_title: 'Kampanje',
    consent: {
      analytics: 'denied',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    browser_id: {
      fbc: 'fb.1.1784368700000.meta-click',
      fbp: 'fb.1.1784368600000.123456789'
    },
    client_ip_address: '203.0.113.8',
    event_device_info: { user_agent: 'Mozilla/5.0' },
    external_id: 'anon_550e8400-e29b-41d4-a716-446655440000'
  }
}

test('maps canonical page_view to a server-side Meta PageView', () => {
  const normalized = mapCanonicalPageViewToMeta(
    pageView()
  ).normalize() as {
    action_source: string
    event_id: string
    event_name: string
    event_source_url: string
    custom_data: { country: string }
    user_data: { fbc: string; fbp: string }
  }

  assert.equal(normalized.event_name, 'PageView')
  assert.equal(normalized.action_source, 'website')
  assert.equal(normalized.event_id, pageView().event_id)
  assert.deepEqual(normalized.custom_data, {
    country: 'Norway'
  })
  assert.equal(
    normalized.event_source_url,
    `${pageView().page_url}.AQQCAQMC`
  )
  assert.equal(
    normalized.user_data.fbc,
    pageView().browser_id?.fbc
  )
  assert.equal(
    normalized.user_data.fbp,
    pageView().browser_id?.fbp
  )
})
