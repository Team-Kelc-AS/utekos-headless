import assert from 'node:assert/strict'
import test from 'node:test'
import { flushCreatedMetaDispatchAttempts } from './flushCreatedMetaDispatchAttempts'

test('runs only Meta outbox attempts before the collector ack', async () => {
  const calls: string[] = []

  await flushCreatedMetaDispatchAttempts(
    [
      {
        adapterKey: 'google:view_category',
        attemptId: '11111111-1111-4111-8111-111111111111'
      },
      {
        adapterKey: 'meta:view_category',
        attemptId: '22222222-2222-4222-8222-222222222222'
      },
      {
        adapterKey: 'meta:view_item_list',
        attemptId: '33333333-3333-4333-8333-333333333333'
      }
    ],
    async input => {
      calls.push(`${input.adapterKey}:${input.attemptId}`)
      return { status: 'accepted_unverified' }
    }
  )

  assert.deepEqual(calls, [
    'meta:view_category:22222222-2222-4222-8222-222222222222',
    'meta:view_item_list:33333333-3333-4333-8333-333333333333'
  ])
})
