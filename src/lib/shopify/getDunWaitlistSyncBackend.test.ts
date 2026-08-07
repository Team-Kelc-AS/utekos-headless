import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DUN_WAITLIST_SYNC_BACKEND_ENV,
  getDunWaitlistSyncBackend
} from './getDunWaitlistSyncBackend'

test('parses legacy and pgmq backends', () => {
  assert.equal(
    getDunWaitlistSyncBackend({
      [DUN_WAITLIST_SYNC_BACKEND_ENV]: 'legacy'
    }),
    'legacy'
  )
  assert.equal(
    getDunWaitlistSyncBackend({
      [DUN_WAITLIST_SYNC_BACKEND_ENV]: 'pgmq'
    }),
    'pgmq'
  )
})

test('fails closed when backend is missing', () => {
  assert.throws(
    () => getDunWaitlistSyncBackend({}),
    /must be exactly "legacy" or "pgmq"/
  )
})

test('fails closed when backend is invalid', () => {
  assert.throws(
    () =>
      getDunWaitlistSyncBackend({
        [DUN_WAITLIST_SYNC_BACKEND_ENV]: 'foo'
      }),
    /must be exactly "legacy" or "pgmq"/
  )
})
