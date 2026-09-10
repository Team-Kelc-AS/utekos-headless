import assert from 'node:assert/strict'
import test from 'node:test'

import type {
  ShopifyTransactionalEmailOrder
} from './fetchShopifyTransactionalEmailOrder'
import {
  getShopifyTransactionalEmailContent
} from './getShopifyTransactionalEmailContent'

const order: ShopifyTransactionalEmailOrder = {
  id: 'gid://shopify/Order/6252199051413',
  legacyResourceId: '6252199051413',
  name: '#1042',
  createdAt: '2026-09-10T08:30:00.000Z',
  cancelledAt: null,
  email: 'kunde@example.no',
  canNotifyCustomer: true,
  statusPageUrl:
    'https://kasse.utekos.no/orders/status/opaque-token',
  currentTotalPriceSet: {
    presentmentMoney: { amount: '990.00', currencyCode: 'NOK' }
  },
  lineItems: {
    nodes: [
      {
        id: 'gid://shopify/LineItem/14584740544661',
        title: '<Comfyrobe>',
        name: 'Comfyrobe - XL',
        quantity: 1,
        variantTitle: 'XL',
        image: null,
        originalUnitPriceSet: {
          presentmentMoney: { amount: '990.00', currencyCode: 'NOK' }
        },
        discountedTotalSet: {
          presentmentMoney: { amount: '790.00', currencyCode: 'NOK' }
        }
      }
    ],
    pageInfo: { hasNextPage: false, endCursor: null }
  }
}

test('renders accessible HTML and plain text for all four notifications', () => {
  for (const notificationType of [
    'order_confirmation',
    'shipping_confirmation',
    'shipment_out_for_delivery',
    'shipment_delivered'
  ] as const) {
    const content = getShopifyTransactionalEmailContent({
      notificationType,
      order
    })

    assert.match(content.subject, /#1042/u)
    assert.match(content.html, /lang="nb"/u)
    assert.match(content.html, /role="presentation"/u)
    assert.match(content.html, /https:\/\/kasse\.utekos\.no/u)
    assert.match(content.html, /&lt;Comfyrobe&gt; · XL/u)
    assert.doesNotMatch(content.html, /<Comfyrobe>/u)
    assert.match(content.text, /790,00\s+kr/u)
    assert.match(content.text, /opaque-token/u)
  }
})
