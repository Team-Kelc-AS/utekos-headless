import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePurchaseProfit } from '@/lib/analytics/server/calculatePurchaseProfit'
const commerce = {
  currency: 'NOK', value: 3580, item_revenue: 2500,
  transaction_id: 'order-test', order_name: 'test', transaction_discount: 100,
  items: [{ item_id: '42903231004920', item_name: 'Mikrofiber', quantity: 2, unit_price: 1400, discount: 32 }]
}
test('uses net item revenue after discounts once and multiplies confirmed cost by quantity', () => {
  assert.equal(calculatePurchaseProfit(commerce), 1300)
})
test('retains a real loss instead of clamping profit to zero', () => {
  assert.equal(calculatePurchaseProfit({ ...commerce, item_revenue: 1000 }), -200)
})
test('does not invent margins for unknown variants, empty baskets or other currencies', () => {
  assert.equal(calculatePurchaseProfit({ ...commerce, currency: 'EUR' }), undefined)
  assert.equal(calculatePurchaseProfit({ ...commerce, items: [] }), undefined)
  assert.equal(calculatePurchaseProfit({ ...commerce, items: [{...commerce.items[0]!, item_id: 'unknown'}] }), undefined)
})
test('legacy net unit prices subtract only the order discount', () => {
  assert.equal(calculatePurchaseProfit({ ...commerce, item_revenue: undefined }), 1500)
})
