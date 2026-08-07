import assert from 'node:assert/strict'
import test from 'node:test'

import {
  dunWaitlistShopifyQueueRecordSchema,
  pgmqMsgIdSchema
} from './dunWaitlistShopifyQueueRecord'

test('normalizes msg_id from string, number, and bigint without precision loss', () => {
  assert.equal(pgmqMsgIdSchema.parse('42'), '42')
  assert.equal(pgmqMsgIdSchema.parse(42), '42')
  assert.equal(pgmqMsgIdSchema.parse(42n), '42')
  assert.equal(
    pgmqMsgIdSchema.parse('9007199254740993'),
    '9007199254740993'
  )
})

test('rejects unsafe or non-integer msg_id values', () => {
  assert.equal(pgmqMsgIdSchema.safeParse('').success, false)
  assert.equal(pgmqMsgIdSchema.safeParse('1.5').success, false)
  assert.equal(pgmqMsgIdSchema.safeParse(1.5).success, false)
  assert.equal(
    pgmqMsgIdSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success,
    false
  )
})

test('parses a valid PGMQ message_record', () => {
  const parsed = dunWaitlistShopifyQueueRecordSchema.parse({
    msg_id: '7',
    read_ct: 1,
    enqueued_at: new Date('2026-08-07T12:00:00.000Z'),
    vt: new Date('2026-08-07T12:02:00.000Z'),
    message: {
      schema_version: 1,
      lead_id: '550e8400-e29b-41d4-a716-446655440000'
    }
  })

  assert.equal(parsed.msg_id, '7')
  assert.equal(parsed.read_ct, 1)
})

test('rejects records with missing message or invalid read_ct', () => {
  assert.equal(
    dunWaitlistShopifyQueueRecordSchema.safeParse({
      msg_id: '1',
      read_ct: 1,
      enqueued_at: new Date(),
      vt: new Date()
    }).success,
    false
  )

  assert.equal(
    dunWaitlistShopifyQueueRecordSchema.safeParse({
      msg_id: 'not-an-id',
      read_ct: 1,
      enqueued_at: new Date(),
      vt: new Date(),
      message: {}
    }).success,
    false
  )

  assert.equal(
    dunWaitlistShopifyQueueRecordSchema.safeParse({
      msg_id: '1',
      read_ct: -1,
      enqueued_at: new Date(),
      vt: new Date(),
      message: {}
    }).success,
    false
  )
})
