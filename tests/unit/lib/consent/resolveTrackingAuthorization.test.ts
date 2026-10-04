import assert from 'node:assert/strict'
import test from 'node:test'
import {
  OPERATOR_TRACKING_AUTHORIZATION,
  resolveTrackingAuthorization
} from '@/lib/consent/resolveTrackingAuthorization'

test('operator policy grants all tracking categories without a CMP', () => {
  assert.deepEqual(resolveTrackingAuthorization(), {
    analytics: 'granted',
    marketing: 'granted',
    preferences: 'granted',
    source: 'operator_policy',
    version: '1'
  })
  assert.deepEqual(
    resolveTrackingAuthorization({ marketing: false }),
    OPERATOR_TRACKING_AUTHORIZATION
  )
})
