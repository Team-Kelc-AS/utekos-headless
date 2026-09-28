import assert from 'node:assert/strict'
import test from 'node:test'
import { shopifyRefundWebhookSchema } from '@/lib/analytics/server/shopifyRefundWebhookPayload'

function baseRefund(overrides: Record<string, unknown> = {}) {
  return {
    id: 890088186,
    order_id: 820982911,
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
        order_id: 820982911,
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

test('2026-04 numeric subtotal parses to finite non-negative number', () => {
  const parsed = shopifyRefundWebhookSchema.parse(baseRefund())
  assert.equal(parsed.refund_line_items[0]?.subtotal, 499.5)
})

test('legacy string subtotal still parses to the same numeric value', () => {
  const withString = baseRefund({
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
  })
  const parsed = shopifyRefundWebhookSchema.parse(withString)
  assert.equal(parsed.refund_line_items[0]?.subtotal, 499.5)
})

test('nullable transaction currency is accepted without fabrication', () => {
  const parsed = shopifyRefundWebhookSchema.parse(
    baseRefund({
      transactions: [
        {
          id: 1,
          order_id: 820982911,
          amount: '499.50',
          currency: null,
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        },
        {
          id: 2,
          order_id: 820982911,
          amount: '0.00',
          currency: 'NOK',
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        }
      ]
    })
  )
  assert.equal(parsed.transactions[0]?.currency, null)
  assert.equal(parsed.transactions[1]?.currency, 'NOK')
})

test('accepts a shipping-only refund with an explicit empty line-item array', () => {
  const parsed = shopifyRefundWebhookSchema.parse(
    baseRefund({
      refund_line_items: [],
      refund_shipping_lines: [
        { id: 1, subtotal_amount: 49, tax_amount: 0 }
      ],
      transactions: [
        {
          id: 3,
          order_id: 820982911,
          amount: '49.00',
          currency: 'NOK',
          kind: 'refund',
          gateway: 'bogus',
          status: 'success',
          created_at: '2021-12-31T19:00:00-05:00'
        }
      ]
    })
  )

  assert.deepEqual(parsed.refund_line_items, [])
})

test('rejects negative subtotal', () => {
  assert.throws(() =>
    shopifyRefundWebhookSchema.parse(
      baseRefund({
        refund_line_items: [
          {
            id: 1,
            line_item_id: 2,
            quantity: 1,
            subtotal: -1,
            line_item: {
              id: 2,
              name: 'x',
              price: '1.00',
              quantity: 1,
              sku: null,
              title: 'x',
              variant_id: null
            }
          }
        ]
      })
    )
  )
})

test('rejects non-finite string subtotal', () => {
  assert.throws(() =>
    shopifyRefundWebhookSchema.parse(
      baseRefund({
        refund_line_items: [
          {
            id: 1,
            line_item_id: 2,
            quantity: 1,
            subtotal: 'not-a-number',
            line_item: {
              id: 2,
              name: 'x',
              price: '1.00',
              quantity: 1,
              sku: null,
              title: 'x',
              variant_id: null
            }
          }
        ]
      })
    )
  )
})

test('rejects invalid refund identities', () => {
  assert.throws(() =>
    shopifyRefundWebhookSchema.parse(baseRefund({ id: -1 }))
  )
  assert.throws(() =>
    shopifyRefundWebhookSchema.parse(
      baseRefund({ order_id: 1.5 })
    )
  )
})
