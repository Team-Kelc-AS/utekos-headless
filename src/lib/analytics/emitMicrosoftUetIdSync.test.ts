import assert from 'node:assert/strict'
import test from 'node:test'
import { createMicrosoftUetIdSyncEmitter } from './emitMicrosoftUetIdSync'

const externalId =
  'anon_550e8400-e29b-41d4-a716-446655440000'

test('emits one consent-ready ID Sync event per browser load', () => {
  const events: unknown[] = []
  const emitter = createMicrosoftUetIdSyncEmitter(event => {
    events.push(event)
  })

  assert.equal(
    emitter.emit({
      externalId,
      pageViewEventId:
        '11111111-1111-4111-8111-111111111111',
      pageViewId: '22222222-2222-4222-8222-222222222222'
    }),
    true
  )
  assert.equal(emitter.emit({ externalId }), false)
  assert.deepEqual(events, [
    {
      event: 'microsoft_uet_id_sync',
      microsoft_vid: '550e8400-e29b-41d4-a716-446655440000',
      page_view_event_id:
        '11111111-1111-4111-8111-111111111111',
      page_view_id: '22222222-2222-4222-8222-222222222222'
    }
  ])
})

test('fails closed for an invalid anonymous external ID', () => {
  const events: unknown[] = []
  const emitter = createMicrosoftUetIdSyncEmitter(event => {
    events.push(event)
  })

  assert.equal(emitter.emit({ externalId: 'invalid' }), false)
  assert.deepEqual(events, [])
})
