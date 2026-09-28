import assert from 'node:assert/strict'
import test from 'node:test'
import {
  diffShopifyCartSnapshots,
  removalsFromCartDiff
} from '@/lib/analytics/server/diffShopifyCartSnapshots'
import type { ShopifyCartSnapshot } from '@/lib/analytics/server/shopifyCartSnapshotStore'

function snapshot(
  lines: ShopifyCartSnapshot['line_items'],
  updatedAt = '2026-07-24T12:00:00.000Z'
): ShopifyCartSnapshot {
  return {
    cart_token: 'cart-token-1',
    line_items: lines,
    stored_at: '2026-07-24T11:59:00.000Z',
    updated_at: updatedAt
  }
}

const lineA = {
  price: '1590.00',
  product_id: '100',
  quantity: 2,
  title: 'Utekos TechDown',
  variant_id: '200',
  currency_code: 'NOK' as const,
  taxable: true,
  vendor: 'Utekos'
}

test('quantity decrease yields remove_from_cart delta', () => {
  const deltas = diffShopifyCartSnapshots({
    prior: snapshot([{ ...lineA, quantity: 3 }]),
    current: snapshot([{ ...lineA, quantity: 1 }])
  })
  const removals = removalsFromCartDiff(deltas)

  assert.equal(removals.length, 1)
  assert.equal(removals[0]?.quantity_removed, 2)
  assert.equal(removals[0]?.prior_line.variant_id, '200')
  assert.equal(removals[0]?.current_quantity, 1)
})

test('quantity increase yields no remove delta', () => {
  const deltas = diffShopifyCartSnapshots({
    prior: snapshot([{ ...lineA, quantity: 1 }]),
    current: snapshot([{ ...lineA, quantity: 3 }])
  })

  assert.equal(removalsFromCartDiff(deltas).length, 0)
  assert.equal(
    deltas.some(delta => delta.kind === 'increased'),
    true
  )
})

test('identical cart yields noop only', () => {
  const deltas = diffShopifyCartSnapshots({
    prior: snapshot([lineA]),
    current: snapshot([lineA])
  })

  assert.equal(removalsFromCartDiff(deltas).length, 0)
  assert.deepEqual(deltas, [
    { kind: 'unchanged', variant_id: '200', quantity: 2 }
  ])
})

test('missing line removes full prior quantity', () => {
  const deltas = diffShopifyCartSnapshots({
    prior: snapshot([lineA]),
    current: snapshot([])
  })
  const removals = removalsFromCartDiff(deltas)

  assert.equal(removals.length, 1)
  assert.equal(removals[0]?.quantity_removed, 2)
  assert.equal(removals[0]?.current_quantity, 0)
})
