import assert from 'node:assert/strict'
import test from 'node:test'

import { getDunWaitlistShopifyRetryDelaySeconds } from './getDunWaitlistShopifyRetryDelaySeconds'

test('maps read_ct 1-4 to 5/10/20/40 minute backoff in seconds', () => {
  assert.equal(getDunWaitlistShopifyRetryDelaySeconds(1), 300)
  assert.equal(getDunWaitlistShopifyRetryDelaySeconds(2), 600)
  assert.equal(getDunWaitlistShopifyRetryDelaySeconds(3), 1200)
  assert.equal(getDunWaitlistShopifyRetryDelaySeconds(4), 2400)
})

test('caps retry delay at 3600 seconds', () => {
  assert.equal(getDunWaitlistShopifyRetryDelaySeconds(5), 3600)
  assert.equal(getDunWaitlistShopifyRetryDelaySeconds(10), 3600)
})

test('rejects non-positive read_ct', () => {
  assert.throws(() => getDunWaitlistShopifyRetryDelaySeconds(0))
  assert.throws(() => getDunWaitlistShopifyRetryDelaySeconds(-1))
})
