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

test('sends SDK-selected IPv6 to Meta without changing the shared canonical IP', () => {
  const event = pageView()
  event.browser_id = {
    ...event.browser_id,
    fbi: '2606:4700:4700::1111.AQQCAQMB'
  }
  const mapped = mapCanonicalPageViewToMeta(
    event
  ).normalize() as { user_data: { client_ip_address: string } }
  assert.equal(
    mapped.user_data.client_ip_address,
    '2606:4700:4700::1111.AQQCAQMB'
  )
  assert.equal(event.client_ip_address, '203.0.113.8')
})

test('maps canonical page_view to a server-side Meta PageView', () => {
  const normalized = mapCanonicalPageViewToMeta(
    pageView()
  ).normalize() as {
    action_source: string
    event_id: string
    event_name: string
    event_source_url: string
    event_time: number
    custom_data?: unknown
    user_data: {
      fbc: string
      fbp: string
      client_ip_address: string
      client_user_agent: string
    }
  }

  assert.equal(normalized.event_name, 'PageView')
  assert.equal(normalized.action_source, 'website')
  assert.equal(normalized.event_id, pageView().event_id)
  assert.equal(
    normalized.event_time,
    Date.parse(pageView().event_time) / 1000
  )
  assert.equal(normalized.custom_data, undefined)
  assert.equal(
    normalized.user_data.client_ip_address,
    pageView().client_ip_address
  )
  assert.equal(
    normalized.user_data.client_user_agent,
    pageView().event_device_info?.user_agent
  )
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
