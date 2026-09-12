import { mapCanonicalPurchaseToGoogleDataManager } from './mapCanonicalPurchaseToGoogleDataManager'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId
} from '../purchaseEvent'
import { hashCustomerMatchIdentifier } from '@/lib/google/data-manager/hashCustomerMatchIdentifier'
import { shopifyGraphqlOrderToCanonicalPurchase } from './shopifyGraphqlOrderToCanonicalPurchase'
import type { ShopifyCommerceReconciliationOrder } from './shopifyCommerceReconciliationGraphqlSchema'
import { BEGIN_CHECKOUT_EVENT_ATTRIBUTE } from '../checkoutAttributionSnapshot'

function money(amount: string, currencyCode = 'NOK') {
  return {
    shopMoney: { amount, currencyCode },
    presentmentMoney: { amount, currencyCode }
  }
}

test('preserves the exact consented checkout correlation for paid-order reconciliation', () => {
  const order = paidOrder()
  const eventId = '33333333-3333-4333-8333-333333333333'
  order.customAttributes.push({
    key: BEGIN_CHECKOUT_EVENT_ATTRIBUTE,
    value: eventId
  })
  assert.equal(
    shopifyGraphqlOrderToCanonicalPurchase(order)
      .begin_checkout_event_id,
    eventId
  )
  order.customAttributes = [
    { key: BEGIN_CHECKOUT_EVENT_ATTRIBUTE, value: eventId }
  ]
  assert.equal(
    shopifyGraphqlOrderToCanonicalPurchase(order)
      .begin_checkout_event_id,
    undefined
  )
})

function paidOrder(
  overrides: Partial<ShopifyCommerceReconciliationOrder> = {}
): ShopifyCommerceReconciliationOrder {
  return {
    id: 'gid://shopify/Order/555',
    legacyResourceId: '555',
    name: '#1555',
    createdAt: '2026-07-01T10:00:00Z',
    processedAt: '2026-07-01T10:01:00Z',
    updatedAt: '2026-07-01T10:05:00Z',
    displayFinancialStatus: 'PAID',
    currencyCode: 'NOK',
    presentmentCurrencyCode: 'NOK',
    taxesIncluded: false,
    email: 'buyer@example.com',
    phone: null,
    clientIp: '203.0.113.10',
    statusPageUrl: 'https://utekos.no/orders/555',
    customAttributes: [
      {
        key: 'utekos_consent',
        value: JSON.stringify({
          analytics: 'granted',
          marketing: 'granted',
          preferences: 'denied',
          version: '1'
        })
      },
      { key: 'utekos_page_url', value: 'https://utekos.no/cart' }
    ],
    totalPriceSet: money('250.00'),
    totalTaxSet: money('50.00'),
    totalShippingPriceSet: money('0.00'),
    discountCodes: ['SAVE10'],
    discountApplications: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          allocationMethod: 'ACROSS',
          targetType: 'LINE_ITEM',
          code: 'SAVE10'
        }
      ]
    },
    shippingAddress: {
      city: 'Oslo',
      phone: null,
      provinceCode: '03',
      zip: '0150',
      countryCodeV2: 'NO'
    },
    billingAddress: null,
    customer: {
      id: 'gid://shopify/Customer/77',
      legacyResourceId: '77',
      defaultEmailAddress: { emailAddress: 'buyer@example.com' },
      defaultPhoneNumber: null
    },
    customerJourneySummary: {
      firstVisit: {
        landingPage: 'https://utekos.no/produkter',
        referrerUrl: 'https://google.com/'
      }
    },
    lineItems: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'gid://shopify/LineItem/10',
          name: 'Pants',
          title: 'Pants',
          quantity: 1,
          sku: 'PNT-1',
          variant: {
            id: 'gid://shopify/ProductVariant/88',
            legacyResourceId: '88'
          },
          originalUnitPriceSet: money('250.00'),
          taxLines: [],
          discountAllocations: []
        }
      ]
    },
    refunds: [],
    ...overrides
  }
}

test('shopifyGraphqlOrderToCanonicalPurchase uses deterministic ids and server source', () => {
  const order = paidOrder()
  order.customAttributes.push(
    { key: 'utekos_facebook_login_id', value: '1234567890' },
    {
      key: 'utekos_facebook_email_sha256',
      value: 'a'.repeat(64)
    },
    {
      key: 'utekos_facebook_phone_sha256',
      value: 'b'.repeat(64)
    }
  )
  const event = shopifyGraphqlOrderToCanonicalPurchase(order)

  assert.equal(event.source, 'server')
  assert.equal(
    event.event_id,
    deterministicPurchaseEventId('555')
  )
  assert.equal(
    event.custom_data.transaction_id,
    shopifyPurchaseTransactionId('555')
  )
  assert.equal(event.event_time, '2026-07-01T10:01:00Z')
  assert.equal(event.custom_data.order_name, '#1555')
  assert.equal(event.custom_data.currency, 'NOK')
  assert.equal(event.custom_data.value, 250)
  assert.equal(event.page_url, 'https://utekos.no/cart')
  assert.equal(event.event_device_info, undefined)
  assert.equal(event.external_id, 'shopify_customer_77')
  assert.equal(event.user_data?.facebook_login_id, '1234567890')
  assert.ok(
    event.user_data?.email_sha256?.includes('a'.repeat(64))
  )
  assert.ok(
    event.user_data?.phone_sha256?.includes('b'.repeat(64))
  )
})

test('shopifyGraphqlOrderToCanonicalPurchase fails closed without order name', () => {
  assert.throws(
    () =>
      shopifyGraphqlOrderToCanonicalPurchase(
        paidOrder({ name: null })
      ),
    /requires a name/
  )
})

test('falls through invalid and blank higher-priority phones to a normalized shipping-address phone', () => {
  const order = paidOrder()
  order.phone = 'not-a-phone'
  order.customer!.defaultPhoneNumber = { phoneNumber: ' ' }
  order.shippingAddress = {
    ...order.shippingAddress!,
    phone: '9999 9999'
  }

  const event = shopifyGraphqlOrderToCanonicalPurchase(order)

  assert.deepEqual(event.user_data?.phone_sha256, [
    hashCustomerMatchIdentifier('+4799999999')
  ])
  assert.doesNotMatch(JSON.stringify(event), /9999 9999/)
})

test('uses the billing-address phone only when higher-precedence phone sources are absent', () => {
  const order = paidOrder({
    shippingAddress: null,
    billingAddress: {
      city: 'Oslo',
      phone: '0047 9999 9999',
      provinceCode: '03',
      zip: '0150',
      countryCodeV2: 'NO'
    }
  })

  const event = shopifyGraphqlOrderToCanonicalPurchase(order)

  assert.deepEqual(event.user_data?.phone_sha256, [
    hashCustomerMatchIdentifier('+4799999999')
  ])
  assert.doesNotMatch(JSON.stringify(event), /0047 9999 9999/)
})


test('passes Meta audience through the paid order to GA4 without changing purchase identity', () => {
  for (const value of ['new_audience', 'engaged_audience', 'existing_customers']) {
    const order = paidOrder()
    const original = shopifyGraphqlOrderToCanonicalPurchase(order)
    order.customAttributes.push({ key: 'utekos_meta_audience', value }, { key: 'ga_client_id', value: '123456789.1784368600' })
    const purchase = shopifyGraphqlOrderToCanonicalPurchase(order)
    assert.equal(purchase.meta_audience, value)
    assert.equal(purchase.event_id, original.event_id)
    assert.equal(purchase.custom_data.transaction_id, original.custom_data.transaction_id)
    const mapped = mapCanonicalPurchaseToGoogleDataManager(purchase)
    assert.equal(mapped.additionalEventParameters?.find(item => item.parameterName === 'audience')?.value, value)
    assert.equal(purchase.consent.source, 'cookiebot')
    if (purchase.consent.source !== 'cookiebot') throw new Error('Test fixture requires explicit consent')
    const denied = { ...purchase, consent: { ...purchase.consent, marketing: 'denied' as const } }
    assert.equal(mapCanonicalPurchaseToGoogleDataManager(denied).additionalEventParameters?.some(item => item.parameterName === 'audience'), false)
  }
})
