import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deterministicRefundEventId,
  shopifyRefundRecordId
} from '@/lib/analytics/refundEvent'
import { shopifyPurchaseTransactionId } from '@/lib/analytics/purchaseEvent'
import { shopifyRefundToCanonicalRefund } from '@/lib/analytics/server/shopifyRefundToCanonicalRefund'

// Use JSON-safe integers (Shopify IDs fit Number only within
// Number.MAX_SAFE_INTEGER; large doc samples are for docs only).
const REFUND_LEGACY_ID = '890088186'
const ORDER_LEGACY_ID = '820982911'

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: Number(REFUND_LEGACY_ID),
    order_id: Number(ORDER_LEGACY_ID),
    created_at: '2021-12-31T19:00:00-05:00',
    refund_line_items: [
      {
        id: 487817672276298627,
        line_item_id: 487817672276298554,
        quantity: 1,
        subtotal: 499.5,
        line_item: {
          id: 487817672276298554,
          name: 'Utekos TechDown',
          price: '499.50',
          quantity: 1,
          sku: 'UTEKOS-1',
          title: 'Utekos TechDown',
          variant_id: 48249962135800
        }
      }
    ],
    transactions: [
      {
        id: 245135271310201194,
        order_id: Number(ORDER_LEGACY_ID),
        amount: '499.50',
        currency: 'NOK',
        kind: 'refund',
        gateway: 'bogus',
        status: 'success',
        created_at: '2021-12-31T19:00:00-05:00'
      }
    ],
    ...overrides
  }
}

test('numeric and string subtotal map to the same canonical value', () => {
  const fromNumber = shopifyRefundToCanonicalRefund(
    basePayload() as never
  )
  const fromString = shopifyRefundToCanonicalRefund(
    basePayload({
      refund_line_items: [
        {
          id: 487817672276298627,
          line_item_id: 487817672276298554,
          quantity: 1,
          subtotal: '499.50',
          line_item: {
            id: 487817672276298554,
            name: 'Utekos TechDown',
            price: '499.50',
            quantity: 1,
            sku: 'UTEKOS-1',
            title: 'Utekos TechDown',
            variant_id: 48249962135800
          }
        }
      ]
    }) as never
  )

  assert.equal(fromNumber.custom_data.value, 499.5)
  assert.equal(fromString.custom_data.value, 499.5)
  assert.equal(
    fromNumber.custom_data.items[0]?.unit_price,
    fromString.custom_data.items[0]?.unit_price
  )
})

test('line-item refund value preserves the complete transaction total', () => {
  const canonical = shopifyRefundToCanonicalRefund(
    basePayload({
      transactions: [
        {
          id: 245135271310201194,
          order_id: Number(ORDER_LEGACY_ID),
          amount: '548.50',
          currency: 'NOK',
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        }
      ]
    }) as never
  )

  assert.equal(canonical.custom_data.items.length, 1)
  assert.equal(canonical.custom_data.value, 548.5)
})

test('currency precedence uses first non-null transaction currency', () => {
  const canonical = shopifyRefundToCanonicalRefund(
    basePayload({
      transactions: [
        {
          id: 1,
          order_id: Number(ORDER_LEGACY_ID),
          amount: '499.50',
          currency: null,
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        },
        {
          id: 2,
          order_id: Number(ORDER_LEGACY_ID),
          amount: '0.00',
          currency: 'EUR',
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        }
      ]
    }) as never
  )

  assert.equal(canonical.custom_data.currency, 'EUR')
})

test('missing authoritative currency fails closed without fabrication', () => {
  assert.throws(
    () =>
      shopifyRefundToCanonicalRefund(
        basePayload({
          transactions: [
            {
              id: 1,
              order_id: Number(ORDER_LEGACY_ID),
              amount: '499.50',
              currency: null,
              kind: 'refund',
              gateway: 'bogus',
              status: 'success',
              created_at: '2021-12-31T19:00:00-05:00'
            }
          ]
        }) as never
      ),
    /transaction currency/i
  )
})

test('deterministic refund identity and canonical semantics are unchanged', () => {
  const canonical = shopifyRefundToCanonicalRefund(
    basePayload() as never
  )
  const expectedId = deterministicRefundEventId(REFUND_LEGACY_ID)

  assert.equal(canonical.event_id, expectedId)
  assert.equal(canonical.event_name, 'refund')
  assert.equal(canonical.source, 'webhook')
  assert.equal(canonical.event_time, '2021-12-31T19:00:00-05:00')
  assert.equal(
    canonical.custom_data.refund_id,
    shopifyRefundRecordId(REFUND_LEGACY_ID)
  )
  assert.equal(
    canonical.custom_data.transaction_id,
    shopifyPurchaseTransactionId(ORDER_LEGACY_ID)
  )
})

test('same refund legacy id always yields the same event_id', () => {
  const first = shopifyRefundToCanonicalRefund(
    basePayload() as never
  )
  const second = shopifyRefundToCanonicalRefund(
    basePayload() as never
  )
  assert.equal(first.event_id, second.event_id)
  assert.equal(
    first.event_id,
    deterministicRefundEventId(REFUND_LEGACY_ID)
  )
})

test('shipping-only refund preserves value and currency with no fabricated items', () => {
  const canonical = shopifyRefundToCanonicalRefund(
    basePayload({
      refund_line_items: [],
      refund_shipping_lines: [
        { id: 1, subtotal_amount: 49, tax_amount: 0 }
      ],
      transactions: [
        {
          id: 20,
          order_id: Number(ORDER_LEGACY_ID),
          amount: '49.00',
          currency: 'NOK',
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        }
      ]
    }) as never
  )

  assert.deepEqual(canonical.custom_data.items, [])
  assert.equal(canonical.custom_data.value, 49)
  assert.equal(canonical.custom_data.currency, 'NOK')
})

test('itemless refund still fails closed on invalid amount and currency', () => {
  assert.throws(() =>
    shopifyRefundToCanonicalRefund(
      basePayload({
        refund_line_items: [],
        transactions: [
          {
            id: 20,
            order_id: Number(ORDER_LEGACY_ID),
            amount: '-1.00',
            currency: 'NOK',
            kind: 'refund',
            gateway: 'bogus',
            status: 'success',
            created_at: '2021-12-31T19:00:00-05:00'
          }
        ]
      }) as never
    )
  )

  assert.throws(() =>
    shopifyRefundToCanonicalRefund(
      basePayload({
        refund_line_items: [],
        transactions: [
          {
            id: 20,
            order_id: Number(ORDER_LEGACY_ID),
            amount: '49.00',
            currency: 'NO',
            kind: 'refund',
            gateway: 'bogus',
            status: 'success',
            created_at: '2021-12-31T19:00:00-05:00'
          }
        ]
      }) as never
    )
  )
})
