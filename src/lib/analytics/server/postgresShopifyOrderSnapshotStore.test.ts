import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ShopifyCommerceReconciliationOrder } from './shopifyCommerceReconciliationGraphqlSchema'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)
moduleWithLoad._load = (request, parent, isMain) =>
  request === 'server-only' ?
    {}
  : originalLoad(request, parent, isMain)

const require = createRequire(import.meta.url)
const { buildShopifyOrderSnapshotRecord } =
  require('./postgresShopifyOrderSnapshotStore.ts') as typeof import('./postgresShopifyOrderSnapshotStore')

function money(amount: string) {
  return {
    shopMoney: { amount, currencyCode: 'NOK' },
    presentmentMoney: { amount, currencyCode: 'NOK' }
  }
}

test('builds an attribution snapshot without copying direct customer contact data', () => {
  const order = {
    id: 'gid://shopify/Order/2005',
    legacyResourceId: '2005',
    name: '#2005',
    createdAt: '2026-09-02T10:00:00Z',
    processedAt: '2026-09-02T10:01:00Z',
    updatedAt: '2026-09-02T10:05:00Z',
    displayFinancialStatus: 'PAID',
    currencyCode: 'NOK',
    presentmentCurrencyCode: 'NOK',
    taxesIncluded: false,
    email: 'must-not-persist@example.com',
    phone: '+4712345678',
    clientIp: '203.0.113.1',
    statusPageUrl: 'https://example.com/private-order-url',
    customAttributes: [
      { key: 'utekos_consent', value: '{"marketing":"granted"}' }
    ],
    totalPriceSet: money('1200.00'),
    subtotalPriceSet: money('1000.00'),
    totalTaxSet: money('200.00'),
    totalShippingPriceSet: money('0.00'),
    totalRefundedSet: money('0.00'),
    discountCodes: [],
    discountApplications: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: []
    },
    shippingAddress: null,
    billingAddress: null,
    displayAddress: { zip: '0150', countryCodeV2: 'NO' },
    customer: null,
    customerJourneySummary: null,
    lineItems: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: []
    },
    refunds: []
  } satisfies ShopifyCommerceReconciliationOrder

  const record = buildShopifyOrderSnapshotRecord(
    { order, syncedAt: '2026-09-03T12:00:00Z' },
    'utekos-development.myshopify.com'
  )
  const serialized = JSON.stringify(record.rawPayload)

  assert.equal(record.totalPriceAmount, 1200)
  assert.equal(record.subtotalPriceAmount, 1000)
  assert.deepEqual(record.displayAddress, {
    zip: '0150',
    countryCodeV2: 'NO'
  })
  assert.doesNotMatch(serialized, /must-not-persist/)
  assert.doesNotMatch(serialized, /12345678/)
  assert.doesNotMatch(serialized, /203\.0\.113\.1/)
  assert.doesNotMatch(serialized, /private-order-url/)
})
