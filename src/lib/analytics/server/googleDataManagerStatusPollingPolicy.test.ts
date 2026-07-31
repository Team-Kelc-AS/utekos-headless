import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GOOGLE_DATA_MANAGER_FIRST_STATUS_CHECK_DELAY_MS,
  computeGoogleDataManagerStatusDelayMs
} from './googleDataManagerStatusPollingPolicy'

const MINUTE_MS = 60_000

test('starts status checks after 30 minutes', () => {
  assert.equal(
    GOOGLE_DATA_MANAGER_FIRST_STATUS_CHECK_DELAY_MS,
    30 * MINUTE_MS
  )
})

test('uses 1.3 backoff, small positive jitter, and a 60-minute cap', () => {
  assert.equal(
    computeGoogleDataManagerStatusDelayMs(0, () => 0),
    30 * MINUTE_MS
  )
  assert.equal(
    computeGoogleDataManagerStatusDelayMs(1, () => 0),
    39 * MINUTE_MS
  )
  assert.equal(
    computeGoogleDataManagerStatusDelayMs(1, () => 1),
    40.95 * MINUTE_MS
  )
  assert.equal(
    computeGoogleDataManagerStatusDelayMs(10, () => 1),
    60 * MINUTE_MS
  )
})
