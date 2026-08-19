import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAdPlatformLogEvents } from './buildAdPlatformLogEvents'

test('builds per-platform event parameters without identity payloads', () => {
  const events = buildAdPlatformLogEvents({
    eventName: 'add_to_cart',
    event: {
      event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
      event_time: '2026-08-19T08:00:00.000Z',
      page_title: 'Utekos TechDown',
      page_url:
        'https://utekos.no/produkter/utekos-techdown?fbclid=secret',
      custom_data: {
        cart_mutation_id: 'mutation-1',
        currency: 'NOK',
        gross_value: 2499,
        value: 1999,
        items: [
          {
            item_id: 'gid://shopify/ProductVariant/123',
            item_name: 'TechDown',
            item_category: 'Jakker',
            quantity: 2,
            variant_id: 'gid://shopify/ProductVariant/123',
            gross_unit_price: 1249.5
          }
        ]
      }
    }
  })

  assert.equal(events?.meta?.eventName, 'AddToCart')
  assert.equal(events?.google?.eventName, 'add_to_cart')
  assert.equal(events?.microsoft_uet?.eventName, 'add_to_cart')
  assert.equal(events?.pinterest?.eventName, 'add_to_cart')
  assert.equal(events?.meta?.parameters.value, 2499)
  assert.equal(events?.google?.parameters.value, 1999)
  assert.deepEqual(events?.meta?.parameters.content_ids, ['123'])
  assert.equal(
    events?.meta?.parameters.event_source_url,
    '/produkter/utekos-techdown'
  )
  assert.equal(
    events?.microsoft_uet?.parameters.eventCategory,
    'ecommerce'
  )
  assert.equal(events?.meta?.requiredParameters.includes('user_data'), true)
  assert.equal(
    Object.hasOwn(events?.meta?.parameters ?? {}, 'user_data'),
    false
  )
  assert.equal(JSON.stringify(events).includes('fbclid'), false)
  assert.equal(JSON.stringify(events).includes('secret'), false)
})
