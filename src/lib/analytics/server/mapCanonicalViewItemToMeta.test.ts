import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import type { CanonicalViewItem } from '../viewItemEvent'
import { mapCanonicalViewItemToMeta } from './mapCanonicalViewItemToMeta'

const emailHash = 'a'.repeat(64)
const phoneHash = 'b'.repeat(64)
const prehashedAppendix = 'AQQAAQMB'
const normalizedAppendix = 'AQQCAQMB'

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function viewItem(
  overrides: Partial<CanonicalViewItem> = {}
): CanonicalViewItem {
  return {
    browser_id: {
      fbc: 'fb.1.1784195800000.meta-click-id',
      fbp: 'fb.1.1784195900000.123456789'
    },
    click_id: { fbclid: 'meta-click-id' },
    client_ip_address: '203.0.113.10',
    consent: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      gross_value: 1990,
      items: [
        {
          gross_unit_price: 1990,
          item_brand: 'Utekos',
          item_category: 'Poncho',
          item_name: 'Utekos TechDown™',
          product_type: 'Yttertøy',
          quantity: 1,
          variant_id:
            'gid://shopify/ProductVariant/48249962135800'
        }
      ]
    },
    event_device_info: { user_agent: 'Mozilla/5.0' },
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_name: 'view_item',
    event_time: '2026-07-16T10:00:00.000Z',
    external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
    location: {
      city: 'Oslo',
      country_code: 'NO',
      postal_code: '0150',
      region_code: '03',
      source: 'customer_provided'
    },
    page_url: 'https://utekos.no/produkter/utekos-techdown',
    user_data: {
      facebook_login_id: '1234567890',
      email_sha256: [emailHash],
      phone_sha256: [phoneHash]
    },
    ...overrides
  } as CanonicalViewItem
}

test('maps canonical view_item to a catalog-compatible Meta ViewContent event', () => {
  const normalized =
    mapCanonicalViewItemToMeta(viewItem()).normalize()

  assert.deepEqual(normalized, {
    event_name: 'ViewContent',
    event_time: 1784196000,
    user_data: {
      em: [`${emailHash}.${prehashedAppendix}`],
      ph: [`${phoneHash}.${prehashedAppendix}`],
      external_id: [
        '47b360efda81ae521d5388c4cd14f96456ebdddda7cad245a7040f40070e9f87.AQQCAQMB'
      ],
      ct: [`${sha256('oslo')}.${normalizedAppendix}`],
      zp: [`${sha256('0150')}.${normalizedAppendix}`],
      country: [`${sha256('no')}.${normalizedAppendix}`],
      client_ip_address: '203.0.113.10',
      client_user_agent: 'Mozilla/5.0',
      fbc: 'fb.1.1784195800000.meta-click-id',
      fbp: 'fb.1.1784195900000.123456789',
      fb_login_id: '1234567890'
    },
    custom_data: {
      value: 1990,
      currency: 'NOK',
      content_name: 'Utekos TechDown™',
      content_category: 'Poncho',
      content_ids: ['48249962135800'],
      contents: [
        {
          id: '48249962135800',
          quantity: 1,
          item_price: 1990,
          title: 'Utekos TechDown™',
          brand: 'Utekos',
          category: 'Poncho'
        }
      ],
      content_type: 'product'
    },
    action_source: 'website',
    event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
    event_source_url:
      'https://utekos.no/produkter/utekos-techdown.AQQCAQMB'
  })
})

test('does not map IP geolocation city or postal code into Meta ct/zp', () => {
  const normalized = mapCanonicalViewItemToMeta(
    viewItem({
      location: {
        city: 'Oslo',
        country_code: 'NO',
        postal_code: '0150',
        region_code: '03',
        source: 'ip_geolocation'
      }
    })
  ).normalize() as {
    user_data: {
      ct?: string[]
      zp?: string[]
      country?: string[]
      client_ip_address?: string
    }
  }

  assert.equal(normalized.user_data.ct, undefined)
  assert.equal(normalized.user_data.zp, undefined)
  assert.equal(normalized.user_data.country, undefined)
  assert.equal(
    normalized.user_data.client_ip_address,
    '203.0.113.10'
  )
})

test('uses the persisted fbc value and never rebuilds it from event time', () => {
  const normalized = mapCanonicalViewItemToMeta(
    viewItem({
      browser_id: {
        fbc: 'fb.1.1784195000000.existing-click',
        fbp: 'fb.1.1784195900000.123456789'
      }
    })
  ).normalize() as { user_data: { fbc: string } }

  assert.equal(
    normalized.user_data.fbc,
    'fb.1.1784195000000.existing-click'
  )
})

test('fails closed without marketing consent', () => {
  assert.throws(
    () =>
      mapCanonicalViewItemToMeta(
        viewItem({
          consent: {
            analytics: 'granted',
            marketing: 'denied',
            preferences: 'denied',
            source: 'cookiebot',
            version: '1'
          }
        })
      ),
    /marketing consent/i
  )
})

test('rejects a variant id that cannot match the Meta catalog', () => {
  const event = viewItem()
  event.custom_data.items[0]!.variant_id = 'not-a-shopify-gid'

  assert.throws(
    () => mapCanonicalViewItemToMeta(event),
    /numeric Shopify ProductVariant ID/
  )
})
