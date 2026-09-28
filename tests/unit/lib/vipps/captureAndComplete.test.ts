import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  captureAndComplete,
  vippsCaptureKey
} from '@/lib/vipps/captureAndComplete'
import { vippsPaymentSchema, type VippsPayment } from '@/lib/vipps/payment'

const checkout = {
  environment: 'test' as const,
  msn: '123456',
  reference: 'utekos-example-1',
  amount: 179000
}
function payment(captured = 0): VippsPayment {
  const money = (value: number) => ({
    currency: 'NOK' as const,
    value
  })
  return {
    reference: checkout.reference,
    state: 'AUTHORIZED',
    amount: money(checkout.amount),
    aggregate: {
      authorizedAmount: money(checkout.amount),
      capturedAmount: money(captured),
      cancelledAmount: money(0),
      refundedAmount: money(0)
    }
  }
}
function harness(
  before = payment(),
  after = payment(checkout.amount)
) {
  const calls: string[] = []
  let reads = 0
  const dependencies = {
    async getPayment() {
      calls.push('read')
      return reads++ ? after : before
    },
    async prepareOrder() {
      calls.push('prepare')
    },
    async capture(
      reference: string,
      amount: number,
      key: string
    ) {
      calls.push('capture')
      assert.equal(reference, checkout.reference)
      assert.equal(amount, checkout.amount)
      assert.equal(key, vippsCaptureKey(checkout))
    },
    async completePaidOrder() {
      calls.push('paid')
      return { id: 'order-1' }
    }
  }
  return { calls, dependencies }
}

test('authorized -> validate order -> capture -> authoritative read -> PAID, without fulfillment', async () => {
  const h = harness()
  assert.equal(
    (await captureAndComplete(checkout, h.dependencies)).status,
    'paid'
  )
  assert.deepEqual(h.calls, [
    'read',
    'prepare',
    'capture',
    'read',
    'paid'
  ])
})
test('capture idempotency key fits Vipps 50-character limit', () => {
  assert.ok(vippsCaptureKey(checkout).length <= 50)
})
test('successful HTTP capture is insufficient when captured amount remains zero', async () => {
  const h = harness(payment(), payment())
  await assert.rejects(
    captureAndComplete(checkout, h.dependencies),
    /capture_not_verified/
  )
  assert.ok(!h.calls.includes('paid'))
})
test('timeout after successful provider capture is resolved by readback', async () => {
  const h = harness()
  h.dependencies.capture = async () => {
    h.calls.push('capture')
    throw new Error('timeout')
  }
  assert.equal(
    (await captureAndComplete(checkout, h.dependencies)).status,
    'paid'
  )
  assert.deepEqual(h.calls, [
    'read',
    'prepare',
    'capture',
    'read',
    'paid'
  ])
})
test('timeout without captured funds never marks PAID', async () => {
  const h = harness(payment(), payment())
  h.dependencies.capture = async () => {
    throw new Error('timeout')
  }
  await assert.rejects(
    captureAndComplete(checkout, h.dependencies),
    /capture_not_verified/
  )
  assert.ok(!h.calls.includes('paid'))
})
test('retry with fully captured payment does not charge again', async () => {
  const h = harness(payment(checkout.amount))
  await captureAndComplete(checkout, h.dependencies)
  assert.deepEqual(h.calls, ['read', 'prepare', 'paid'])
})
for (const state of [
  'CREATED',
  'ABORTED',
  'EXPIRED',
  'TERMINATED'
] as const) {
  test(`${state} cannot trigger capture or PAID`, async () => {
    const h = harness({ ...payment(), state })
    await captureAndComplete(checkout, h.dependencies)
    assert.deepEqual(h.calls, ['read'])
  })
}
test('reject amount/reference mismatch before charging', async () => {
  for (const before of [
    { ...payment(), reference: 'wrong-reference' },
    {
      ...payment(),
      amount: { currency: 'NOK' as const, value: 100 }
    }
  ]) {
    const h = harness(before)
    await assert.rejects(
      captureAndComplete(checkout, h.dependencies),
      /mismatch/
    )
    assert.deepEqual(h.calls, ['read'])
  }
})
test('partial captures, refunds and cancellations require reconciliation, not another full charge', async () => {
  for (const field of [
    'capturedAmount',
    'refundedAmount',
    'cancelledAmount'
  ] as const) {
    const before = payment()
    before.aggregate![field].value = 1
    const h = harness(before)
    await assert.rejects(
      captureAndComplete(checkout, h.dependencies),
      /unexpected_payment_aggregate/
    )
    assert.deepEqual(h.calls, ['read'])
  }
})
test('invalid/missing provider amounts fail closed', () => {
  assert.equal(
    vippsPaymentSchema.safeParse({
      ...payment(),
      amount: { currency: 'EUR', value: 179000 }
    }).success,
    false
  )
  assert.equal(
    vippsPaymentSchema.safeParse({
      ...payment(),
      amount: { currency: 'NOK', value: 17.9 }
    }).success,
    false
  )
})
test('order validation failure prevents charge', async () => {
  const h = harness()
  h.dependencies.prepareOrder = async () => {
    throw new Error('price changed')
  }
  await assert.rejects(
    captureAndComplete(checkout, h.dependencies),
    /price changed/
  )
  assert.ok(!h.calls.includes('capture'))
  assert.ok(!h.calls.includes('paid'))
})
test('failed readback never marks PAID', async () => {
  const h = harness()
  let count = 0
  h.dependencies.getPayment = async () => {
    if (count++) throw new Error('provider unavailable')
    return payment()
  }
  await assert.rejects(
    captureAndComplete(checkout, h.dependencies),
    /provider unavailable/
  )
  assert.ok(!h.calls.includes('paid'))
})
test('Shopify failure after capture can be retried without another capture', async () => {
  const h = harness()
  h.dependencies.completePaidOrder = async () => {
    throw new Error('Shopify unavailable')
  }
  await assert.rejects(
    captureAndComplete(checkout, h.dependencies),
    /Shopify unavailable/
  )
  const retry = harness(payment(checkout.amount))
  assert.equal(
    (await captureAndComplete(checkout, retry.dependencies))
      .status,
    'paid'
  )
  assert.ok(!retry.calls.includes('capture'))
})
test('capture idempotency key isolates environment, MSN and amount', () => {
  const keys = [
    checkout,
    { ...checkout, environment: 'production' as const },
    { ...checkout, msn: '987654' },
    { ...checkout, amount: 100 }
  ].map(vippsCaptureKey)
  assert.equal(new Set(keys).size, 4)
  assert.equal(vippsCaptureKey({ ...checkout }), keys[0])
  assert.match(keys[0]!, /^[a-zA-Z0-9-]{8,64}$/)
})
