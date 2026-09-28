import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicRefundEventId,
  shopifyRefundRecordId
} from '@/lib/analytics/refundEvent'
import { shopifyPurchaseTransactionId } from '@/lib/analytics/purchaseEvent'
import { normalizeCanonicalRefund } from '@/lib/analytics/server/normalizeCanonicalRefund'

function refund(refundLegacyId: string, eventId?: string) {
  return {
    schema_version: 1 as const,
    event_name: 'refund' as const,
    event_id:
      eventId ?? deterministicRefundEventId(refundLegacyId),
    event_time: '2026-07-22T10:00:00.000Z',
    source: 'webhook' as const,
    environment: 'test' as const,
    consent: {
      analytics: 'denied' as const,
      marketing: 'denied' as const,
      preferences: 'denied' as const,
      source: 'cookiebot' as const,
      version: '1'
    },
    custom_data: {
      currency: 'NOK',
      value: 49,
      transaction_id: shopifyPurchaseTransactionId('555'),
      refund_id: shopifyRefundRecordId(refundLegacyId),
      items: []
    }
  }
}

test('accepts the deterministic Refund identity derived from refund_id', () => {
  const event = normalizeCanonicalRefund(refund('900'), {})

  assert.equal(event.event_id, deterministicRefundEventId('900'))
  assert.equal(
    event.custom_data.refund_id,
    shopifyRefundRecordId('900')
  )
  assert.equal(
    event.custom_data.transaction_id,
    shopifyPurchaseTransactionId('555')
  )
})

test('rejects an alternative event_id for the same Shopify Refund', () => {
  assert.throws(
    () =>
      normalizeCanonicalRefund(
        refund('900', '61c2ef59-6e6f-4f56-a63a-567ca398f9de'),
        {}
      ),
    /canonical_refund_identity_mismatch/
  )
})

test('rejects a Refund outside the Shopify refund namespace', () => {
  assert.throws(
    () =>
      normalizeCanonicalRefund(
        {
          ...refund('900'),
          custom_data: {
            ...refund('900').custom_data,
            refund_id: 'refund-900'
          }
        },
        {}
      ),
    /canonical_refund_identity_mismatch/
  )
})

test('rejects a transaction outside the Shopify order namespace', () => {
  assert.throws(
    () =>
      normalizeCanonicalRefund(
        {
          ...refund('900'),
          custom_data: {
            ...refund('900').custom_data,
            transaction_id: 'checkout-555'
          }
        },
        {}
      ),
    /canonical_refund_identity_mismatch/
  )
})

test('different Shopify Refund records retain different deterministic event IDs', () => {
  const first = normalizeCanonicalRefund(refund('900'), {})
  const second = normalizeCanonicalRefund(refund('901'), {})

  assert.notEqual(first.event_id, second.event_id)
})
