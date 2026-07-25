import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyGoogleDataManagerEventFreshness } from './googleDataManagerEventFreshness'

const now = Date.parse('2026-07-25T10:00:00.000Z')

test('classifies the exact 48-hour boundary as on time', () => {
  assert.equal(
    classifyGoogleDataManagerEventFreshness(
      '2026-07-23T10:00:00.000Z',
      now
    ),
    'within_48h'
  )
})

test('classifies after 48 hours through exactly 72 hours as late but eligible', () => {
  assert.equal(
    classifyGoogleDataManagerEventFreshness(
      '2026-07-23T09:59:59.999Z',
      now
    ),
    'late_within_window'
  )
  assert.equal(
    classifyGoogleDataManagerEventFreshness(
      '2026-07-22T10:00:00.000Z',
      now
    ),
    'late_within_window'
  )
})

test('classifies events older than 72 hours outside the provider window', () => {
  assert.equal(
    classifyGoogleDataManagerEventFreshness(
      '2026-07-22T09:59:59.999Z',
      now
    ),
    'outside_72h'
  )
})
