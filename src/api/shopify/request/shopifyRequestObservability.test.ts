import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyShopifyRequestError } from './shopifyRequestObservability'

test('classifies Next.js prerender fetch abort as cancellation', () => {
  assert.equal(
    classifyShopifyRequestError({
      error: new Error(
        'During prerendering, fetch() rejects when the prerender is complete. Typically these errors are handled by React but if you move fetch() to a different context by using `setTimeout`, `after`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "/produkter/techdown".'
      ),
      didTimeout: false
    }),
    'aborted'
  )
})

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
