import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalBeginCheckoutSchema } from '../beginCheckoutEvent'
import type { ShopifyCanonicalCheckoutProgressObservation } from '../shopifyCheckoutObservationContract'
import type {
  CanonicalEventStore,
  CanonicalEventStoreInput
} from './canonicalEventStore'
import { promoteShopifyAddShippingInfoObservation } from './promoteShopifyAddShippingInfoObservation'

const beginCheckoutEventId =
  '71c2ef59-6e6f-4f56-a63a-567ca398f9de'
const observation: ShopifyCanonicalCheckoutProgressObservation = {
  contract: 'utekos.shopify.checkout_observation',
  schemaVersion: 2,
  source: 'shopify_app_web_pixel',
  verificationStatus: 'observed',
  eventId: 'shopify-shipping-event-1',
  eventName: 'checkout_shipping_info_submitted',
  eventSequence: 6,
  occurredAt: '2026-08-17T10:05:00.000Z',
  checkoutToken: 'checkout-token',
  correlation: { beginCheckoutEventId },
  commerce: { currencyCode: 'NOK', value: 2490, itemQuantity: 1 },
  privacy: {
    analyticsProcessingAllowed: true,
    marketingAllowed: true,
    preferencesProcessingAllowed: false,
    saleOfDataAllowed: false
  }
}
const beginCheckout = canonicalBeginCheckoutSchema.parse({
  schema_version: 1,
  event_name: 'begin_checkout',
  event_id: beginCheckoutEventId,
  event_time: '2026-08-17T10:00:00.000Z',
  source: 'web',
  environment: 'production',
  page_url: 'https://utekos.no/handlekurv',
  page_title: 'Handlekurv',
  browser_id: {
    ga_client_id: '1234567890.987654321',
    fbp: 'fb.1.1234567890.1234567890'
  },
  consent: {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  custom_data: {
    currency: 'NOK', value: 2490, gross_value: 2490,
    tax_value: 498, cart_id: 'cart-1', checkout_id: 'checkout-1',
    creation_revision: '1',
    items: [{
      item_id: 'variant-1', item_name: 'Utekos Dun', unit_price: 2490,
      gross_unit_price: 2490, quantity: 1, tax_amount: 498,
      tax_rate: 0.25, taxable: true, price_includes_tax: true,
      product_id: 'gid://shopify/Product/1',
      variant_id: 'gid://shopify/ProductVariant/1',
      product_handle: 'utekos-dun', available_for_sale: true,
      currently_not_in_stock: false, quantity_available: 3,
      collection_ids: [], collection_titles: [], selected_options: []
    }]
  }
})

test('promotes correlated shipping submission to canonical Meta outbox', async () => {
  const accepted: CanonicalEventStoreInput[] = []
  const store: Required<CanonicalEventStore> = {
    async find() { return beginCheckout },
    async accept(input) {
      accepted.push(input)
      return { createdDispatchAttempts: [], status: 'inserted' }
    }
  }
  const result = await promoteShopifyAddShippingInfoObservation(
    observation,
    {
      config: { enabled: true, cutoverAt: '2026-08-17T10:04:00.000Z' },
      environment: 'production',
      store
    }
  )
  assert.equal(result.status, 'inserted')
  assert.equal(accepted[0]?.event.event_name, 'add_shipping_info')
  assert.deepEqual(accepted[0]?.dispatches, [{
    dispatch_mode: 'server_retry',
    event_id: accepted[0]!.event.event_id,
    provider: 'meta'
  }])
  assert.equal(accepted[0]?.event.consent.marketing, 'granted')
})
