import assert from 'node:assert/strict'
import test from 'node:test'
import { deterministicPurchaseEventId } from '@/lib/analytics/purchaseEvent'
import { deterministicRefundEventId } from '@/lib/analytics/refundEvent'
import {
  createShopifyReconciliationCommerceSourceEvidence,
  createShopifyWebhookCommerceSourceEvidence
} from '@/lib/analytics/server/shopifyCommerceSourceEvidence'

const purchase = {
  event_id: deterministicPurchaseEventId('12345'),
  event_name: 'purchase' as const,
  event_time: '2026-07-21T20:00:00.000Z',
  custom_data: { transaction_id: 'shopify_order_12345' }
}

const refund = {
  event_id: deterministicRefundEventId('67890'),
  event_name: 'refund' as const,
  event_time: '2026-07-21T21:00:00.000Z',
  custom_data: {
    refund_id: 'shopify_refund_67890',
    transaction_id: 'shopify_order_12345'
  }
}

function webhookHeaders(topic: string) {
  return new Headers({
    'authorization': 'Bearer must-not-persist',
    'x-shopify-api-version': '2026-04',
    'x-shopify-event-id': 'merchant-event-1',
    'x-shopify-hmac-sha256': 'must-not-persist',
    'x-shopify-topic': topic,
    'x-shopify-triggered-at': '2026-07-21T20:00:00.500Z',
    'x-shopify-webhook-id': 'delivery-1'
  })
}

test('verified purchase webhook headers produce only the approved source fields', () => {
  const evidence = createShopifyWebhookCommerceSourceEvidence({
    event: purchase,
    headers: webhookHeaders('orders/paid'),
    observedAt: new Date('2026-07-21T20:00:01.000Z')
  })

  assert.deepEqual(evidence, {
    canonical_event_id: purchase.event_id,
    source_system: 'shopify',
    source_method: 'webhook',
    source_object_type: 'order',
    source_object_id: '12345',
    source_topic: 'orders/paid',
    source_delivery_id: 'delivery-1',
    source_event_id: 'merchant-event-1',
    source_api_version: '2026-04',
    source_triggered_at: '2026-07-21T20:00:00.500Z',
    source_observed_at: '2026-07-21T20:00:01.000Z'
  })
  assert.equal(
    JSON.stringify(evidence).includes('must-not-persist'),
    false
  )
})

test('verified refund webhook headers preserve refund identity', () => {
  const evidence = createShopifyWebhookCommerceSourceEvidence({
    event: refund,
    headers: webhookHeaders('refunds/create'),
    observedAt: new Date('2026-07-21T21:00:01.000Z')
  })

  assert.equal(evidence.canonical_event_id, refund.event_id)
  assert.equal(evidence.source_object_type, 'refund')
  assert.equal(evidence.source_object_id, '67890')
  assert.equal(evidence.source_topic, 'refunds/create')
})

test('webhook evidence fails closed on missing metadata or the wrong topic', () => {
  const missingDelivery = webhookHeaders('orders/paid')
  missingDelivery.delete('x-shopify-webhook-id')

  assert.throws(() =>
    createShopifyWebhookCommerceSourceEvidence({
      event: purchase,
      headers: missingDelivery,
      observedAt: new Date('2026-07-21T20:00:01.000Z')
    })
  )

  assert.throws(() =>
    createShopifyWebhookCommerceSourceEvidence({
      event: purchase,
      headers: webhookHeaders('refunds/create'),
      observedAt: new Date('2026-07-21T20:00:01.000Z')
    })
  )
})

test('reconciliation uses event time and never fabricates delivery metadata', () => {
  const evidence =
    createShopifyReconciliationCommerceSourceEvidence({
      apiVersion: '2026-04',
      event: refund,
      observedAt: new Date('2026-07-22T00:00:00.000Z')
    })

  assert.deepEqual(evidence, {
    canonical_event_id: refund.event_id,
    source_system: 'shopify',
    source_method: 'reconciliation',
    source_object_type: 'refund',
    source_object_id: '67890',
    source_topic: 'refunds/create',
    source_delivery_id: null,
    source_event_id: null,
    source_api_version: '2026-04',
    source_triggered_at: refund.event_time,
    source_observed_at: '2026-07-22T00:00:00.000Z'
  })
})

test('webhook and reconciliation preserve the same deterministic canonical identity', () => {
  const webhookEvidence =
    createShopifyWebhookCommerceSourceEvidence({
      event: purchase,
      headers: webhookHeaders('orders/paid'),
      observedAt: new Date('2026-07-21T20:00:01.000Z')
    })
  const reconciliationEvidence =
    createShopifyReconciliationCommerceSourceEvidence({
      apiVersion: '2026-04',
      event: purchase,
      observedAt: new Date('2026-07-22T00:00:00.000Z')
    })

  assert.equal(
    webhookEvidence.canonical_event_id,
    deterministicPurchaseEventId('12345')
  )
  assert.equal(
    reconciliationEvidence.canonical_event_id,
    webhookEvidence.canonical_event_id
  )
  assert.equal(
    reconciliationEvidence.source_object_id,
    webhookEvidence.source_object_id
  )
})

test('invalid canonical Shopify object identity fails closed', () => {
  assert.throws(() =>
    createShopifyReconciliationCommerceSourceEvidence({
      apiVersion: '2026-04',
      event: {
        ...purchase,
        custom_data: { transaction_id: 'other_order_12345' }
      },
      observedAt: new Date('2026-07-22T00:00:00.000Z')
    })
  )
})
