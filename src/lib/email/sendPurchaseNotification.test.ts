import assert from 'node:assert/strict'
import test from 'node:test'
import type { CanonicalPurchase } from '@/lib/analytics/purchaseEvent'
import { sendPurchaseNotification } from './sendPurchaseNotification'

const purchase = {
  event_id: '61c2ef59-6e6f-4f56-a63a-567ca398f9de',
  custom_data: {
    currency: 'NOK',
    items: [{ item_id: '1', item_name: 'Utekos', quantity: 1, unit_price: 1790 }],
    value: 1790
  }
} as CanonicalPurchase

test('sends a privacy-safe idempotent purchase email', async () => {
  const calls: Array<Record<string, unknown>> = []
  const result = await sendPurchaseNotification(purchase, {
    getConfig: () => ({
      apiKey: 'test',
      fromEmail: 'kundeservice@utekos.no',
      fromName: 'Utekos',
      contactFormSendToEmail: 'internt@utekos.no'
    }),
    getRecipient: () => 'internt@utekos.no',
    sendEmail: async input => {
      calls.push(input)
      return { id: 'email-1', ok: true }
    }
  })

  assert.deepEqual(result, { delivery: 'sent', ok: true })
  assert.equal(calls.length, 1)
  assert.equal(
    calls[0]?.idempotencyKey,
    `purchase-notification/${purchase.event_id}`
  )
  assert.equal(
    JSON.stringify(calls[0]).includes('internt@utekos.no'),
    true
  )
  assert.equal(JSON.stringify(calls[0]).includes('NOK'), true)
  assert.equal(JSON.stringify(calls[0]).includes('item_name'), false)
  assert.equal(JSON.stringify(calls[0]).includes('transaction_id'), false)
})

test('treats a reused idempotency key as already delivered', async () => {
  const result = await sendPurchaseNotification(purchase, {
    getConfig: () => ({
      apiKey: 'test',
      fromEmail: 'kundeservice@utekos.no',
      fromName: 'Utekos',
      contactFormSendToEmail: 'internt@utekos.no'
    }),
    getRecipient: () => 'internt@utekos.no',
    sendEmail: async () => ({
      message: 'idempotency key already used',
      ok: false,
      reason: 'already_registered'
    })
  })

  assert.deepEqual(result, {
    delivery: 'already_sent',
    ok: true
  })
})
