import assert from 'node:assert/strict'
import test from 'node:test'
import { logKlarnaCheckoutStage } from './logKlarnaCheckoutStage'

test('writes a searchable Klarna order-stage runtime log', async t => {
  const lines: string[] = []
  t.mock.method(console, 'log', (value: unknown) => {
    lines.push(String(value))
  })

  await logKlarnaCheckoutStage({
    durationMs: 81,
    request: new Request('https://utekos.no/api/klarna/orders', {
      headers: { 'x-vercel-id': 'arn1::request-2' }
    }),
    stage: 'order_created'
  })

  assert.equal(lines.length, 1)
  const entry = JSON.parse(lines[0] ?? '{}') as {
    context: Record<string, unknown>
    data: Record<string, unknown>
    event: string
  }

  assert.equal(entry.event, 'commerce.klarna_checkout')
  assert.equal(entry.data.stage, 'order_created')
  assert.equal(entry.context.requestPath, '/api/klarna/orders')
})

test('fails open when both runtime log transports throw', async t => {
  t.mock.method(console, 'log', () => {
    throw new Error('console.log unavailable')
  })
  t.mock.method(console, 'warn', () => {
    throw new Error('console.warn unavailable')
  })

  await assert.doesNotReject(
    logKlarnaCheckoutStage({
      durationMs: 81,
      request: new Request(
        'https://utekos.no/api/klarna/orders'
      ),
      stage: 'order_created'
    })
  )
})
