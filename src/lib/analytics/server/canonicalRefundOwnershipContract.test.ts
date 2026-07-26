import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalPurchaseSchema } from '../purchaseEvent'
import {
  deterministicPurchaseEventId,
  shopifyPurchaseTransactionId
} from '../purchaseEvent'
import { acceptCanonicalRefund } from './acceptCanonicalRefund'
import type { CanonicalEventLookup } from './canonicalEventStore'
import { createCanonicalEventStore } from './createCanonicalEventStore'
import { shopifyGraphqlRefundToCanonicalRefund } from './shopifyGraphqlRefundToCanonicalRefund'
import { shopifyRefundToCanonicalRefund } from './shopifyRefundToCanonicalRefund'
import type {
  ShopifyCommerceReconciliationOrder,
  ShopifyCommerceReconciliationRefund
} from './shopifyCommerceReconciliationGraphqlSchema'

const REFUND_CREATED_AT = '2026-07-22T10:00:00.000Z'

function money(amount: string) {
  return {
    shopMoney: { amount, currencyCode: 'NOK' },
    presentmentMoney: { amount, currencyCode: 'NOK' }
  }
}

function purchase() {
  return canonicalPurchaseSchema.parse({
    schema_version: 1,
    event_name: 'purchase',
    event_id: deterministicPurchaseEventId('555'),
    event_time: '2026-07-22T09:00:00.000Z',
    source: 'webhook',
    environment: 'test',
    browser_id: {
      ga_client_id: '123456789.1784201643',
      ga_session_id: '1784201643'
    },
    consent: {
      analytics: 'granted',
      marketing: 'denied',
      preferences: 'denied',
      source: 'cookiebot',
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      value: 199,
      transaction_id: shopifyPurchaseTransactionId('555'),
      order_name: '#1555',
      items: [
        {
          item_id: '88',
          item_name: 'Utekos Stapper',
          quantity: 1,
          unit_price: 199
        }
      ]
    }
  })
}

function webhookRefund() {
  return shopifyRefundToCanonicalRefund({
    id: 900,
    order_id: 555,
    created_at: REFUND_CREATED_AT,
    refund_line_items: [],
    transactions: [
      {
        id: 700,
        order_id: 555,
        amount: '49.00',
        currency: 'NOK',
        kind: 'refund',
        gateway: 'shopify_payments',
        status: 'pending',
        created_at: REFUND_CREATED_AT
      }
    ]
  })
}

function reconciliationRefund() {
  const order = {
    legacyResourceId: '555'
  } as ShopifyCommerceReconciliationOrder
  const refund = {
    id: 'gid://shopify/Refund/900',
    legacyResourceId: '900',
    createdAt: REFUND_CREATED_AT,
    updatedAt: REFUND_CREATED_AT,
    totalRefundedSet: money('49.00'),
    refundLineItems: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: []
    },
    transactions: {
      pageInfo: { hasNextPage: false, endCursor: null },
      nodes: [
        {
          id: 'gid://shopify/OrderTransaction/700',
          amountSet: money('49.00'),
          status: 'PENDING',
          kind: 'REFUND',
          gateway: 'shopify_payments',
          createdAt: REFUND_CREATED_AT,
          order: { legacyResourceId: '555' }
        }
      ]
    }
  } satisfies ShopifyCommerceReconciliationRefund

  return shopifyGraphqlRefundToCanonicalRefund({ order, refund })
}

function sourceEvidence(
  eventId: string,
  sourceMethod: 'reconciliation' | 'webhook'
) {
  return {
    canonical_event_id: eventId,
    source_system: 'shopify',
    source_method: sourceMethod,
    source_object_type: 'refund',
    source_object_id: '900',
    source_topic: 'refunds/create',
    source_delivery_id:
      sourceMethod === 'webhook' ? 'delivery-900' : null,
    source_event_id:
      sourceMethod === 'webhook' ? 'event-900' : null,
    source_api_version: '2026-04',
    source_triggered_at: REFUND_CREATED_AT,
    source_observed_at:
      sourceMethod === 'webhook' ?
        '2026-07-22T10:00:01.000Z'
      : '2026-07-22T10:05:00.000Z'
  }
}

test('webhook and reconciliation converge on one attributed Refund ledger row and one provider attempt', async () => {
  const fromWebhook = webhookRefund()
  const fromReconciliation = reconciliationRefund()
  const ledgerKeys = new Set<string>()
  const ledgerPayloads: unknown[] = []
  const dispatchKeys: string[] = []
  const lookupEventIds: string[] = []
  const sourceMethods: string[] = []
  const store = Object.assign(
    createCanonicalEventStore(work =>
      work({
        insertLedger: async row => {
          if (ledgerKeys.has(row.idempotency_key)) return false
          ledgerKeys.add(row.idempotency_key)
          ledgerPayloads.push(row.payload)
          return true
        },
        insertDispatch: async row => {
          dispatchKeys.push(
            `${row.provider}:${row.idempotency_key}`
          )
          return '00000000-0000-4000-8000-000000000001'
        },
        upsertSourceEvidence: async row => {
          sourceMethods.push(row.source_method)
        }
      })
    ),
    {
      find: async (input: CanonicalEventLookup) => {
        lookupEventIds.push(input.event_id)
        return purchase()
      }
    }
  )

  assert.equal(fromWebhook.event_id, fromReconciliation.event_id)
  assert.equal(
    fromWebhook.custom_data.refund_id,
    fromReconciliation.custom_data.refund_id
  )
  assert.equal(
    fromWebhook.custom_data.transaction_id,
    fromReconciliation.custom_data.transaction_id
  )

  const first = await acceptCanonicalRefund({
    payload: fromWebhook,
    requestContext: {},
    sourceEvidence: sourceEvidence(
      fromWebhook.event_id,
      'webhook'
    ),
    store
  })
  const duplicate = await acceptCanonicalRefund({
    payload: fromReconciliation,
    requestContext: {},
    sourceEvidence: sourceEvidence(
      fromReconciliation.event_id,
      'reconciliation'
    ),
    store
  })

  assert.equal(first.status, 'accepted')
  assert.equal(duplicate.status, 'duplicate')
  assert.equal(ledgerKeys.size, 1)
  assert.equal(ledgerPayloads.length, 1)
  assert.deepEqual(lookupEventIds, [
    deterministicPurchaseEventId('555'),
    deterministicPurchaseEventId('555')
  ])
  assert.deepEqual(sourceMethods, ['webhook', 'reconciliation'])
  assert.deepEqual(dispatchKeys, [
    `google:refund:${fromWebhook.event_id}`
  ])
  assert.equal(new Set(dispatchKeys).size, dispatchKeys.length)
  assert.deepEqual(
    (ledgerPayloads[0] as { consent: unknown }).consent,
    purchase().consent
  )
  assert.deepEqual(
    (ledgerPayloads[0] as { browser_id: unknown }).browser_id,
    purchase().browser_id
  )
  assert.deepEqual(
    (ledgerPayloads[0] as { custom_data: { items: unknown[] } })
      .custom_data.items,
    []
  )
})

test('missing Purchase linkage accepts operationally without fabricating attribution or attempts', async () => {
  const event = webhookRefund()
  const ledgerPayloads: unknown[] = []
  const dispatchKeys: string[] = []
  const store = Object.assign(
    createCanonicalEventStore(work =>
      work({
        insertLedger: async row => {
          ledgerPayloads.push(row.payload)
          return true
        },
        insertDispatch: async row => {
          dispatchKeys.push(
            `${row.provider}:${row.idempotency_key}`
          )
          return '00000000-0000-4000-8000-000000000001'
        },
        upsertSourceEvidence: async () => {}
      })
    ),
    { find: async () => null }
  )

  const result = await acceptCanonicalRefund({
    payload: event,
    requestContext: {},
    sourceEvidence: sourceEvidence(event.event_id, 'webhook'),
    store
  })

  assert.equal(result.status, 'accepted')
  assert.equal(ledgerPayloads.length, 1)
  assert.deepEqual(dispatchKeys, [])
  assert.deepEqual(
    (ledgerPayloads[0] as { consent: unknown }).consent,
    event.consent
  )
  assert.equal(
    'browser_id' in (ledgerPayloads[0] as object),
    false
  )
})
