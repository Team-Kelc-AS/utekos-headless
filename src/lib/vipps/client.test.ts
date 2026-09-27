import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createVippsClient } from './client'
import type { VippsConfig } from './config'

const config: VippsConfig = {
  environment: 'test',
  apiBaseUrl: 'https://apitest.vipps.no',
  msn: '123456',
  clientId: 'fixture-client',
  clientSecret: 'fixture-secret',
  subscriptionKey: 'fixture-subscription'
}
const reference = 'utekos-express-test'
const money = (value: number) => ({ currency: 'NOK', value })
const payment = {
  reference,
  state: 'AUTHORIZED',
  amount: money(179000),
  aggregate: {
    authorizedAmount: money(179000),
    capturedAmount: money(179000),
    refundedAmount: money(0),
    cancelledAmount: money(0)
  },
  userDetails: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    mobileNumber: '4712345678'
  }
}
type Call = { url: string; init: RequestInit }
function harness(
  responder: (call: Call) => Response | Promise<Response>
) {
  const calls: Call[] = []
  const fetcher: typeof fetch = async (url, init) => {
    const call = { url: String(url), init: init ?? {} }
    calls.push(call)
    return responder(call)
  }
  return { calls, client: createVippsClient(config, fetcher) }
}
const token = () =>
  Response.json({
    access_token: 'fixture-bearer',
    token_type: 'Bearer',
    expires_in: '3600'
  })

test('token is cached/coalesced and actual ePayment profile fields survive validation', async () => {
  const h = harness(({ url }) =>
    url.endsWith('/accesstoken/get') ? token() : (
      Response.json(payment)
    )
  )
  const values = await Promise.all([
    h.client.getPayment(reference),
    h.client.getPayment(reference)
  ])
  assert.equal(
    h.calls.filter(call => call.url.endsWith('/accesstoken/get'))
      .length,
    1
  )
  assert.deepEqual(values[0]?.userDetails, payment.userDetails)
  const headers = new Headers(h.calls[1]!.init.headers)
  assert.equal(headers.get('Merchant-Serial-Number'), config.msn)
  assert.equal(
    headers.get('Authorization'),
    'Bearer fixture-bearer'
  )
  assert.equal(h.calls[1]!.init.redirect, 'error')
})

test('401 refresh keeps exact capture body and idempotency key', async () => {
  let captures = 0
  const h = harness(({ url }) => {
    if (url.endsWith('/accesstoken/get')) return token()
    return captures++ === 0 ?
        new Response(null, { status: 401 })
      : new Response(null, { status: 204 })
  })
  await h.client.capture(reference, 179000, 'capture-stable-key')
  const attempts = h.calls.filter(call =>
    call.url.endsWith('/capture')
  )
  assert.equal(attempts.length, 2)
  assert.equal(attempts[0]!.init.body, attempts[1]!.init.body)
  assert.deepEqual(JSON.parse(String(attempts[0]!.init.body)), {
    modificationAmount: money(179000)
  })
  for (const call of attempts)
    assert.equal(
      new Headers(call.init.headers).get('Idempotency-Key'),
      'capture-stable-key'
    )
})

test('network timeout is not retried inside the capture client', async () => {
  const h = harness(({ url }) => {
    if (url.endsWith('/accesstoken/get')) return token()
    throw new Error('simulated timeout')
  })
  await assert.rejects(
    h.client.capture(reference, 179000, 'capture-stable-key'),
    /timeout/
  )
  assert.equal(
    h.calls.filter(call => call.url.endsWith('/capture')).length,
    1
  )
})

test('invalid operations are rejected before any request', async () => {
  const h = harness(() => {
    throw new Error('should not fetch')
  })
  await assert.rejects(
    h.client.capture(reference, 1.5, 'capture-stable-key')
  )
  await assert.rejects(h.client.capture(reference, 100, 'short'))
  await assert.rejects(h.client.getPayment('../outside'))
  assert.equal(h.calls.length, 0)
})

test('provider error text and credentials never appear in errors', async () => {
  const h = harness(({ url }) =>
    url.endsWith('/accesstoken/get') ? token() : (
      new Response('private-provider-details', { status: 500 })
    )
  )
  await assert.rejects(h.client.getPayment(reference), error => {
    assert.ok(error instanceof Error)
    assert.doesNotMatch(
      error.message,
      /private-provider-details|fixture-|utekos-express-test/
    )
    return true
  })
})

test('unexpected provider currency never reaches capture orchestration', async () => {
  const h = harness(({ url }) =>
    url.endsWith('/accesstoken/get') ? token() : (
      Response.json({
        ...payment,
        amount: { currency: 'EUR', value: 179000 }
      })
    )
  )
  await assert.rejects(
    h.client.getPayment(reference),
    /payment_response/
  )
})
