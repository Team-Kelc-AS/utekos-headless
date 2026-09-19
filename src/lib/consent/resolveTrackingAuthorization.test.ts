import assert from 'node:assert/strict'
import test from 'node:test'
import {
  OPERATOR_TRACKING_AUTHORIZATION,
  resolveTrackingAuthorization
} from './resolveTrackingAuthorization'

test('operator policy grants all tracking categories without a CMP', () => {
  assert.deepEqual(resolveTrackingAuthorization(), {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'granted',
    source: 'cookiebot',
    version: '1'
  })
  assert.deepEqual(
    resolveTrackingAuthorization({ marketing: false }),
    OPERATOR_TRACKING_AUTHORIZATION
  )
})
