import assert from 'node:assert/strict'
import test from 'node:test'
import type { OrderPaid } from 'types/commerce/order/OrderPaid'
import {
  checkoutAttributionSnapshotToShopifyAttributes,
  createCheckoutAttributionSnapshot
} from '../checkoutAttributionSnapshot'
import { hashCustomerMatchIdentifier } from '@/lib/google/data-manager/hashCustomerMatchIdentifier'
import { shopifyOrderToCanonicalPurchase } from './shopifyOrderToCanonicalPurchase'
import { checkoutProductContextToShopifyAttributes } from '../checkoutProductContext'

function orderPaid(): OrderPaid {
  const attribution = createCheckoutAttributionSnapshot(
    {
      browser_id: {
        fbc: 'fb.1.1784368700000.meta-click',
        fbp: 'fb.1.1784368600000.123456789',
        ga_client_id: '123456789.1784368600'
      },
      click_id: { fbclid: 'meta-click', gclid: 'google-click' },
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      experiment: {
        key: 'skreddersy-varmen-layout-v1',
        variant: 'legacy'
      },
      external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
      page_url:
        'https://utekos.no/produkter/utekos-techdown?fbclid=meta-click'
    },
    '2026-07-18T10:00:00.000Z'
  )

  return {
    id: 12345,
    browser_ip: '203.0.113.8',
    client_details: { user_agent: 'Mozilla/5.0' },
    contact_email: 'kunde@example.com',
    created_at: '2026-07-18T10:05:00.000Z',
    currency: 'NOK',
    customer: {
      id: 999,
      email: 'kunde@example.com',
      phone: '+4799999999',
      orders_count: 1
    },
    email: 'kunde@example.com',
    landing_site: 'https://utekos.no/?fbclid=meta-click',
    line_items: [
      {
        id: 1,
        name: 'Utekos TechDown',
        price: '1990.00',
        price_set: {
          shop_money: {
            amount: '1990.00',
            currency_code: 'NOK'
          },
          presentment_money: {
            amount: '1990.00',
            currency_code: 'NOK'
          }
        },
        quantity: 1,
        sku: 'UTEKOS-1',
        tax_lines: [{ rate: 0.25 }],
        discount_allocations: [],
        title: 'Utekos TechDown',
        variant_id: 48249962135800
      }
    ],
    name: '#12345',
    note_attributes:
      checkoutAttributionSnapshotToShopifyAttributes(
        attribution
      ).map(attribute => ({
        name: attribute.key,
        value: attribute.value
      })),
    order_number: 12345,
    order_status_url:
      'https://checkout.shopify.com/orders/secret',
    phone: '+4799999999',
    presentment_currency: 'NOK',
    processed_at: '2026-07-18T10:06:00.000Z',
    referring_site: 'https://facebook.com/',
    shipping_address: {
      city: 'Oslo',
      country_code: 'NO',
      province_code: '03',
      zip: '0150'
    },
    discount_applications: [],
    discount_codes: [],
    taxes_included: true,
    total_price: '1990.00',
    total_price_set: {
      shop_money: { amount: '1990.00', currency_code: 'NOK' },
      presentment_money: {
        amount: '1990.00',
        currency_code: 'NOK'
      }
    },
    total_shipping_price_set: {
      shop_money: { amount: '0.00', currency_code: 'NOK' },
      presentment_money: { amount: '0.00', currency_code: 'NOK' }
    },
    total_tax_set: {
      shop_money: { amount: '398.00', currency_code: 'NOK' },
      presentment_money: {
        amount: '398.00',
        currency_code: 'NOK'
      }
    },
    total_tax: '398.00'
  } as unknown as OrderPaid
}

test('restores checkout attribution for the purchase webhook', () => {
  const order = orderPaid()
  order.note_attributes.push(
    { name: 'utekos_facebook_login_id', value: '1234567890' },
    {
      name: 'utekos_facebook_email_sha256',
      value: 'a'.repeat(64)
    },
    {
      name: 'utekos_facebook_phone_sha256',
      value: 'b'.repeat(64)
    }
  )
  const event = shopifyOrderToCanonicalPurchase(order)

  assert.equal(
    event.external_id,
    'anon_550e8400-e29b-41d4-a716-446655440000'
  )
  assert.deepEqual(event.browser_id, {
    fbc: 'fb.1.1784368700000.meta-click',
    fbp: 'fb.1.1784368600000.123456789',
    ga_client_id: '123456789.1784368600'
  })
  assert.deepEqual(event.click_id, {
    fbclid: 'meta-click',
    gclid: 'google-click'
  })
  assert.equal(
    event.page_url,
    'https://utekos.no/produkter/utekos-techdown'
  )
  assert.deepEqual(event.location, {
    city: 'Oslo',
    country_code: 'NO',
    postal_code: '0150',
    region_code: '03',
    source: 'customer_provided'
  })
  assert.equal(event.consent.marketing, 'granted')
  assert.equal(event.consent.analytics, 'granted')
  assert.deepEqual(event.experiment, {
    key: 'skreddersy-varmen-layout-v1',
    variant: 'legacy'
  })
  assert.equal(event.user_data?.facebook_login_id, '1234567890')
  assert.ok(
    event.user_data?.email_sha256?.includes('a'.repeat(64))
  )
  assert.ok(
    event.user_data?.phone_sha256?.includes('b'.repeat(64))
  )
  assert.equal(event.custom_data.value, 1990)
  assert.equal(event.custom_data.item_revenue, 1592)
  assert.equal(
    event.custom_data.customer_segmentation,
    'new_customer_to_business'
  )
  assert.deepEqual(event.custom_data.items[0], {
    item_id: '48249962135800',
    item_name: 'Utekos TechDown',
    quantity: 1,
    unit_price: 1592,
    final_unit_price: 1990,
    sku: 'UTEKOS-1'
  })
})

test('only derives existing-customer segmentation from a real Shopify order count', () => {
  const existingCustomerOrder = orderPaid()
  existingCustomerOrder.customer!.orders_count = 4
  const unknownCustomerOrder = orderPaid()
  delete unknownCustomerOrder.customer!.orders_count
  const invalidCustomerOrder = orderPaid()
  invalidCustomerOrder.customer!.orders_count = -1

  assert.equal(
    shopifyOrderToCanonicalPurchase(existingCustomerOrder)
      .custom_data.customer_segmentation,
    'existing_customer_to_business'
  )
  assert.equal(
    shopifyOrderToCanonicalPurchase(unknownCustomerOrder)
      .custom_data.customer_segmentation,
    undefined
  )
  assert.equal(
    shopifyOrderToCanonicalPurchase(invalidCustomerOrder)
      .custom_data.customer_segmentation,
    undefined
  )
})

test('restores exact product brand and category for purchase dispatch', () => {
  const order = orderPaid()
  order.line_items[0]!.vendor = 'Fallback vendor'
  order.note_attributes.push(
    ...checkoutProductContextToShopifyAttributes([
      {
        item_id: '48249962135800',
        item_brand: 'Utekos',
        item_category: 'Ponchoer'
      }
    ]).map(attribute => ({
      name: attribute.key,
      value: attribute.value
    }))
  )

  const item =
    shopifyOrderToCanonicalPurchase(order).custom_data.items[0]

  assert.equal(item?.item_brand, 'Utekos')
  assert.equal(item?.item_category, 'Ponchoer')
})

test('derives fbclid from appendix-bearing fbc when click_id is missing', () => {
  const attribution = createCheckoutAttributionSnapshot(
    {
      browser_id: {
        fbc: 'fb.1.1784368700000.meta-click-only.AQQCAQMB',
        fbp: 'fb.1.1784368600000.123456789.AQQCAQMB'
      },
      consent: {
        analytics: 'granted',
        marketing: 'granted',
        preferences: 'denied',
        source: 'cookiebot',
        version: '1'
      },
      external_id: 'anon_550e8400-e29b-41d4-a716-446655440000',
      page_url: 'https://utekos.no/produkter/utekos-techdown'
    },
    '2026-07-18T10:00:00.000Z'
  )
  const order = orderPaid()
  order.note_attributes =
    checkoutAttributionSnapshotToShopifyAttributes(
      attribution
    ).map(attribute => ({
      name: attribute.key,
      value: attribute.value
    }))

  const event = shopifyOrderToCanonicalPurchase(order)

  assert.equal(event.click_id?.fbclid, 'meta-click-only')
  assert.equal(
    event.browser_id?.fbc,
    'fb.1.1784368700000.meta-click-only.AQQCAQMB'
  )
})

test('uses a namespaced Shopify customer id only without first-party external_id', () => {
  const order = orderPaid()
  order.note_attributes = order.note_attributes.filter(
    attribute => attribute.name !== 'utekos_external_id'
  )

  assert.equal(
    shopifyOrderToCanonicalPurchase(order).external_id,
    'shopify_customer_999'
  )
})

test('falls through invalid and blank higher-priority phones to a normalized shipping-address phone', () => {
  const order = orderPaid()
  order.phone = 'not-a-phone'
  order.customer!.phone = ' '
  order.shipping_address = {
    ...order.shipping_address!,
    phone: '9999 9999'
  }

  const event = shopifyOrderToCanonicalPurchase(order)

  assert.deepEqual(event.user_data?.phone_sha256, [
    hashCustomerMatchIdentifier('+4799999999')
  ])
  assert.doesNotMatch(JSON.stringify(event), /9999 9999/)
})

test('uses the billing-address phone only when higher-precedence phone sources are absent', () => {
  const order = orderPaid()
  order.phone = null
  order.customer!.phone = null
  order.shipping_address = null
  order.billing_address = {
    city: 'Oslo',
    country_code: 'NO',
    province_code: '03',
    zip: '0150',
    phone: '0047 9999 9999'
  } as OrderPaid['billing_address']

  const event = shopifyOrderToCanonicalPurchase(order)

  assert.deepEqual(event.user_data?.phone_sha256, [
    hashCustomerMatchIdentifier('+4799999999')
  ])
  assert.doesNotMatch(JSON.stringify(event), /0047 9999 9999/)
})

test('maps item-scoped Shopify discounts to net item revenue', () => {
  const order = orderPaid()
  const lineItem = order.line_items[0]!

  order.discount_applications = [
    {
      allocation_method: 'each',
      code: 'FULLDISCOUNT',
      target_type: 'line_item'
    }
  ] as OrderPaid['discount_applications']
  order.discount_codes = [
    {
      code: 'FULLDISCOUNT',
      amount: '1990.00',
      type: 'percentage'
    }
  ]
  order.total_price_set = {
    shop_money: { amount: '0.00', currency_code: 'NOK' },
    presentment_money: { amount: '0.00', currency_code: 'NOK' }
  }
  order.total_tax_set = {
    shop_money: { amount: '0.00', currency_code: 'NOK' },
    presentment_money: { amount: '0.00', currency_code: 'NOK' }
  }
  lineItem.discount_allocations = [
    {
      amount: '1990.00',
      amount_set: {
        shop_money: { amount: '1990.00', currency_code: 'NOK' },
        presentment_money: {
          amount: '1990.00',
          currency_code: 'NOK'
        }
      },
      discount_application_index: 0
    }
  ]

  const event = shopifyOrderToCanonicalPurchase(order)

  assert.equal(event.custom_data.value, 0)
  assert.equal(event.custom_data.item_revenue, 0)
  assert.equal(event.custom_data.transaction_discount, 1592)
  assert.deepEqual(event.custom_data.coupon_codes, [
    'FULLDISCOUNT'
  ])
  assert.deepEqual(event.custom_data.items[0], {
    item_id: '48249962135800',
    item_name: 'Utekos TechDown',
    quantity: 1,
    unit_price: 0,
    final_unit_price: 0,
    discount: 1592,
    sku: 'UTEKOS-1'
  })
})

test('keeps presentment currency and transaction-level discounts coherent', () => {
  const order = orderPaid()
  const lineItem = order.line_items[0]!

  order.presentment_currency = 'EUR'
  order.taxes_included = false
  order.discount_applications = [
    {
      allocation_method: 'across',
      code: 'EURO20',
      target_type: 'line_item'
    }
  ] as OrderPaid['discount_applications']
  order.discount_codes = [
    { code: 'EURO20', amount: '20.00', type: 'fixed_amount' }
  ]
  order.total_price_set = {
    shop_money: { amount: '920.00', currency_code: 'NOK' },
    presentment_money: { amount: '80.00', currency_code: 'EUR' }
  }
  order.total_tax_set = {
    shop_money: { amount: '0.00', currency_code: 'NOK' },
    presentment_money: { amount: '0.00', currency_code: 'EUR' }
  }
  order.total_shipping_price_set = {
    shop_money: { amount: '0.00', currency_code: 'NOK' },
    presentment_money: { amount: '0.00', currency_code: 'EUR' }
  }
  lineItem.price_set = {
    shop_money: { amount: '1150.00', currency_code: 'NOK' },
    presentment_money: { amount: '100.00', currency_code: 'EUR' }
  }
  lineItem.tax_lines = []
  lineItem.discount_allocations = [
    {
      amount: '230.00',
      amount_set: {
        shop_money: { amount: '230.00', currency_code: 'NOK' },
        presentment_money: {
          amount: '20.00',
          currency_code: 'EUR'
        }
      },
      discount_application_index: 0
    }
  ]

  const event = shopifyOrderToCanonicalPurchase(order)

  assert.equal(event.custom_data.currency, 'EUR')
  assert.equal(event.custom_data.value, 80)
  assert.equal(event.custom_data.item_revenue, 80)
  assert.equal(event.custom_data.transaction_discount, 20)
  assert.equal(event.custom_data.items[0]?.unit_price, 100)
  assert.equal(event.custom_data.items[0]?.final_unit_price, 80)
  assert.equal(event.custom_data.items[0]?.discount, undefined)
})
