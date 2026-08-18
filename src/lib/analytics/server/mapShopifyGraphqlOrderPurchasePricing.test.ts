import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapShopifyGraphqlOrderPurchasePricing,
  readShopifyGraphqlMoneyAmount
} from './mapShopifyGraphqlOrderPurchasePricing'
import type { ShopifyCommerceReconciliationOrder } from './shopifyCommerceReconciliationGraphqlSchema'

function money(amount: string, currencyCode = 'NOK') {
  return {
    shopMoney: { amount, currencyCode },
    presentmentMoney: { amount, currencyCode }
  }
}

function baseOrder(
  overrides: Partial<ShopifyCommerceReconciliationOrder> = {}
): ShopifyCommerceReconciliationOrder {
  return {
    id: 'gid://shopify/Order/1',
    legacyResourceId: '1',
    name: '#1001',
    createdAt: '2026-07-01T10:00:00Z',
    processedAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:05:00Z',
    displayFinancialStatus: 'PAID',
    currencyCode: 'NOK',
    presentmentCurrencyCode: 'NOK',
    taxesIncluded: false,
    email: null,
    phone: null,
    clientIp: null,
    statusPageUrl: null,
    customAttributes: [],
    totalPriceSet: money('100.00'),
    totalTaxSet: money('0.00'),
    totalShippingPriceSet: money('0.00'),
    discountCodes: [],
    discountApplications: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: []
    },
    shippingAddress: null,
    billingAddress: null,
    customer: null,
    customerJourneySummary: null,
    lineItems: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'gid://shopify/LineItem/10',
          name: 'Jacket',
          title: 'Jacket',
          quantity: 1,
          sku: 'JKT-1',
          vendor: 'Utekos',
          product: { vendor: 'Utekos', productType: 'Jackets' },
          variant: {
            id: 'gid://shopify/ProductVariant/99',
            legacyResourceId: '99'
          },
          originalUnitPriceSet: money('100.00'),
          taxLines: [],
          discountAllocations: []
        }
      ]
    },
    refunds: [],
    ...overrides
  }
}

test('readShopifyGraphqlMoneyAmount prefers presentment currency match', () => {
  assert.equal(
    readShopifyGraphqlMoneyAmount(
      money('42.50', 'NOK'),
      'nok',
      'total'
    ),
    42.5
  )
})

test('mapShopifyGraphqlOrderPurchasePricing maps item revenue', () => {
  const pricing = mapShopifyGraphqlOrderPurchasePricing(
    baseOrder(),
    'NOK'
  )

  assert.equal(pricing.itemRevenue, 100)
  assert.equal(pricing.items.length, 1)
  assert.equal(pricing.items[0]?.item_id, '99')
  assert.equal(pricing.items[0]?.unit_price, 100)
  assert.equal(pricing.items[0]?.item_brand, 'Utekos')
  assert.equal(pricing.items[0]?.item_category, 'Jackets')
})

test('mapShopifyGraphqlOrderPurchasePricing applies each-scoped discounts', () => {
  const order = baseOrder({
    lineItems: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'gid://shopify/LineItem/10',
          name: 'Jacket',
          title: 'Jacket',
          quantity: 2,
          sku: 'JKT-1',
          variant: {
            id: 'gid://shopify/ProductVariant/99',
            legacyResourceId: '99'
          },
          originalUnitPriceSet: money('100.00'),
          taxLines: [],
          discountAllocations: [
            {
              allocatedAmountSet: money('20.00'),
              discountApplication: {
                allocationMethod: 'EACH',
                targetType: 'LINE_ITEM'
              }
            }
          ]
        }
      ]
    }
  })

  const pricing = mapShopifyGraphqlOrderPurchasePricing(
    order,
    'NOK'
  )
  assert.equal(pricing.items[0]?.discount, 10)
  assert.equal(pricing.transactionDiscount, 20)
})

test('mapShopifyGraphqlOrderPurchasePricing fails closed without an item name', () => {
  const order = baseOrder()
  order.lineItems.nodes[0] = {
    ...order.lineItems.nodes[0]!,
    name: null,
    title: null
  }

  assert.throws(
    () => mapShopifyGraphqlOrderPurchasePricing(order, 'NOK'),
    /requires a name/
  )
})
