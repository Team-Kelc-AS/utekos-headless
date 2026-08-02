import assert from 'node:assert/strict'
import test from 'node:test'

import {
  deriveLandingEdgeRequestId,
  readVercelRequestId
} from './landing-edge-request-id.ts'

test('normalizes the Vercel header to the documented runtime request id', () => {
  assert.equal(
    readVercelRequestId(
      'arn1::cdwvz-1785574222361-9968da94ed15'
    ),
    'cdwvz-1785574222361-9968da94ed15'
  )
  assert.equal(
    readVercelRequestId('cdwvz-1785574222361-9968da94ed15'),
    'cdwvz-1785574222361-9968da94ed15'
  )
})

test('derives the same UUIDv5 from a Vercel header and Log Drain request id', async () => {
  const fromHeader = await deriveLandingEdgeRequestId(
    'arn1::cdwvz-1785574222361-9968da94ed15'
  )
  const fromDrain = await deriveLandingEdgeRequestId(
    'cdwvz-1785574222361-9968da94ed15'
  )

  assert.equal(fromHeader, '3edf1ca6-47ba-5792-8e9c-18388178551a')
  assert.equal(fromHeader, fromDrain)
  assert.match(
    fromHeader ?? '',
    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
  )
})

test('rejects missing and malformed Vercel identifiers', async () => {
  assert.equal(await deriveLandingEdgeRequestId(undefined), undefined)
  assert.equal(await deriveLandingEdgeRequestId('arn1::'), undefined)
  assert.equal(
    await deriveLandingEdgeRequestId('arn1::request id'),
    undefined
  )
})
