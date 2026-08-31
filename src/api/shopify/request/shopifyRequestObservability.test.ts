import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyShopifyRequestError } from './shopifyRequestObservability'

test('classifies caller cancellation separately from provider timeout', () => {
  const caller = new AbortController()
  caller.abort(new Error('render cancelled'))

  assert.equal(
    classifyShopifyRequestError({
      error: caller.signal.reason,
      didTimeout: false,
      callerSignal: caller.signal
    }),
    'aborted'
  )
})

test('preserves a real wall-clock timeout', () => {
  assert.equal(
    classifyShopifyRequestError({
      error: new DOMException('deadline', 'TimeoutError'),
      didTimeout: true
    }),
    'timeout'
  )
})
