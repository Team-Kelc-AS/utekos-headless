import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPurchaseSchema } from '../purchaseEvent'
import {
  META_LAST_PAID_CLICK_MODEL_VERSION,
  mapCanonicalPurchaseToMetaAppendAttribution
} from './mapCanonicalPurchaseToMetaAppendAttribution'

const purchaseTime = Date.parse('2026-09-25T12:00:00.000Z') / 1000
const clickTime = purchaseTime - 6 * 24 * 60 * 60
const now = purchaseTime + 60

function purchase(overrides: Record<string, unknown> = {}) {
  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: '22222222-2222-4222-8222-222222222222',
    event_time: '2026-09-25T12:00:00.000Z',
    source: 'webhook',
    environment: 'production',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    campaign: { ad_id: '120246935997000788', source: 'meta' },
    browser_id: {
      fbc: `fb.1.${clickTime * 1000}.meta-click`,
      fbp: 'fb.1.1784368600000.123456789'
    },
    client_ip_address: '203.0.113.8',
    event_device_info: { user_agent: 'Mozilla/5.0' },
    external_id: 'anon-customer',
    page_url: 'https://utekos.no/produkter/utekos-techdown',
    referrer_url: 'https://www.facebook.com/',
    user_data: {
      facebook_login_id: '123456789',
      email_sha256: ['a'.repeat(64)]
    },
    custom_data: {
      currency: 'NOK',
      value: 1990,
      transaction_id: 'shopify_order_12345',
      order_name: '#12345',
      items: [
        {
          item_id: '48249962135800',
          item_name: 'Utekos TechDown',
          quantity: 1,
          unit_price: 1990
        }
      ]
    },
    ...overrides
  })
}

test('maps a qualifying last Meta paid click within seven days', () => {
  const event = mapCanonicalPurchaseToMetaAppendAttribution(
    purchase(),
    now
  )

  assert.deepEqual(event, {
    action_source: 'website',
    attribution_data: {
      ad_id: '120246935997000788',
      attribution_share: 1,
      attribution_value: 1990,
      touchpoint_ts: clickTime
    },
    custom_data: { currency: 'NOK' },
    event_id: `22222222-2222-4222-8222-222222222222:${META_LAST_PAID_CLICK_MODEL_VERSION}`,
    event_name: 'AppendAttribution',
    event_source_url:
      'https://utekos.no/produkter/utekos-techdown',
    event_time: now,
    marketing_consent: 'granted',
    original_event_data: {
      event_name: 'Purchase',
      event_time: purchaseTime,
      order_id: 'shopify_order_12345'
    },
    referrer_url: 'https://www.facebook.com/',
    user_data: {
      client_ip_address: '203.0.113.8',
      client_user_agent: 'Mozilla/5.0',
      email_sha256: ['a'.repeat(64)],
      external_id: 'anon-customer',
      fb_login_id: '123456789',
      fbc: `fb.1.${clickTime * 1000}.meta-click`,
      fbp: 'fb.1.1784368600000.123456789'
    }
  })
})

test('does not attribute an older Meta click or a newer non-Meta paid click', () => {
  const oldClick = purchase({
    browser_id: {
      fbc: `fb.1.${(purchaseTime - 7 * 24 * 60 * 60 - 1) * 1000}.old`
    }
  })
  const googleWinner = purchase({
    campaign: { ad_id: '120246935997000788', source: 'google' }
  })

  assert.equal(
    mapCanonicalPurchaseToMetaAppendAttribution(oldClick, now),
    undefined
  )
  assert.equal(
    mapCanonicalPurchaseToMetaAppendAttribution(googleWinner, now),
    undefined
  )
})

test('fails closed without consent, exact ad identity, or send window', () => {
  assert.equal(
    mapCanonicalPurchaseToMetaAppendAttribution(
      purchase({
        consent: {
          analytics: 'granted',
          marketing: 'denied',
          preferences: 'denied',
          source: 'cookiebot',
          version: '1'
        },
        campaign: undefined,
        browser_id: undefined,
        external_id: undefined,
        user_data: undefined
      }),
      now
    ),
    undefined
  )
  assert.equal(
    mapCanonicalPurchaseToMetaAppendAttribution(
      purchase({ campaign: { ad_id: 'not-meta-id', source: 'meta' } }),
      now
    ),
    undefined
  )
  assert.equal(
    mapCanonicalPurchaseToMetaAppendAttribution(
      purchase(),
      purchaseTime + 48 * 60 * 60 + 1
    ),
    undefined
  )
})
