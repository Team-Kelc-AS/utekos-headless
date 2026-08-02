import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalGenerateLead } from '../generateLeadEvent'
import { mapCanonicalLeadToMeta } from './mapCanonicalLeadToMeta'

function lead(): CanonicalGenerateLead {
  return {
    schema_version: 1,
    event_name: 'generate_lead',
    event_id: '22222222-2222-4222-8222-222222222222',
    event_time: '2026-08-02T00:00:00.000Z',
    source: 'server',
    environment: 'test',
    page_url: 'https://utekos.no/skreddersy-varmen',
    page_view_id: '11111111-1111-4111-8111-111111111111',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    browser_id: {
      fbc: 'fb.1.1785628800000.meta-click',
      fbp: 'fb.1.1785628800000.123456789'
    },
    client_ip_address: '203.0.113.10',
    event_device_info: { user_agent: 'Mozilla/5.0' },
    user_data: {
      email_sha256: [
        '8c87b489ce35cf3f65c78c1f3ce86cf5c6165dfc0f6f6bc2b4d8e9f0a1b2c3d4'
      ]
    },
    custom_data: {
      submission_id: '22222222-2222-4222-8222-222222222222',
      form_id: 'newsletter_signup',
      lead_type: 'newsletter',
      currency: 'NOK',
      value: 0
    }
  }
}

test('maps canonical generate_lead to deduplicated Meta Lead', () => {
  const event = lead()
  const emailHash = event.user_data?.email_sha256?.[0]
  assert.ok(emailHash)
  const normalized = mapCanonicalLeadToMeta(event).normalize() as {
    action_source: string
    custom_data: { currency: string; value: number }
    event_id: string
    event_name: string
    event_source_url: string
    user_data: { em: string[]; fbc: string; fbp: string }
  }

  assert.equal(normalized.event_name, 'Lead')
  assert.equal(normalized.event_id, event.event_id)
  assert.equal(normalized.action_source, 'website')
  assert.match(normalized.event_source_url, /^https:\/\/utekos\.no\//)
  assert.equal(normalized.custom_data.currency, 'NOK')
  assert.equal(normalized.custom_data.value, 0)
  assert.match(
    normalized.user_data.em[0] ?? '',
    new RegExp(`^${emailHash}(?:\\.|$)`)
  )
  assert.equal(normalized.user_data.fbc, event.browser_id?.fbc)
  assert.equal(normalized.user_data.fbp, event.browser_id?.fbp)
})

test('fails closed without marketing consent', () => {
  const event = lead()
  event.consent.marketing = 'denied'

  assert.throws(
    () => mapCanonicalLeadToMeta(event),
    /marketing consent/i
  )
})
