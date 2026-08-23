import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifySnapchatEventFreshness,
  SNAPCHAT_MAX_EVENT_AGE_MS
} from './snapchatEventFreshness'

test('accepts events through the strict seven-day boundary', () => {
  const now = Date.parse('2026-08-23T10:00:00.000Z')
  assert.equal(
    classifySnapchatEventFreshness(
      new Date(now - SNAPCHAT_MAX_EVENT_AGE_MS).toISOString(),
      now
    ),
    'within_7d'
  )
})

test('rejects events older than seven days and invalid timestamps', () => {
  const now = Date.parse('2026-08-23T10:00:00.000Z')
  assert.equal(
    classifySnapchatEventFreshness(
      new Date(
        now - SNAPCHAT_MAX_EVENT_AGE_MS - 1
      ).toISOString(),
      now
    ),
    'outside_7d'
  )
  assert.equal(
    classifySnapchatEventFreshness('invalid', now),
    'outside_7d'
  )
})
