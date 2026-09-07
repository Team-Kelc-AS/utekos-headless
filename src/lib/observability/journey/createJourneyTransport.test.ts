import assert from 'node:assert/strict'
import test from 'node:test'
import { createJourneyTransport } from './createJourneyTransport'
import type { JourneyEvent } from './contract'

const event: JourneyEvent = {
  schema_version: 1,
  event_id: '11111111-1111-4111-8111-111111111111',
  journey_id: '22222222-2222-4222-8222-222222222222',
  page_view_id: '33333333-3333-4333-8333-333333333333',
  occurred_at: '2026-09-06T10:00:00Z',
  page_path: '/skreddersy-varmen',
  consent: {
    analytics: 'granted',
    marketing: 'denied',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  },
  source: 'browser',
  environment: 'test',
  event_name: 'page_arrival',
  data: { navigation_type: 'initial' }
}
const settle = () =>
  new Promise<void>(resolve => setImmediate(resolve))

test('network failure and503 retry the identical payload/id; duplicate acknowledgement ends retries', async () => {
  const bodies: string[] = []
  const callbacks: (() => void)[] = []
  const transport = createJourneyTransport({
    allowed: () => true,
    fetch: async (_url, init) => {
      bodies.push(String(init?.body))
      if (bodies.length === 1) throw new Error('offline')
      return new Response(null, {
        status: bodies.length === 2 ? 503 : 200
      })
    },
    schedule: callback => {
      callbacks.push(callback)
      return 1 as unknown as ReturnType<typeof setTimeout>
    }
  })
  transport.send(event)
  transport.send(event)
  await settle()
  callbacks.shift()!()
  await settle()
  callbacks.shift()!()
  await settle()
  assert.equal(bodies.length, 3)
  assert.equal(new Set(bodies).size, 1)
  assert.equal(callbacks.length, 0)
})

test('no send or retry after withdrawal; abort in-flight work and clear timers', async () => {
  let allowed = true
  let calls = 0
  let canceled = 0
  const transport = createJourneyTransport({
    allowed: () => allowed,
    fetch: async () => {
      calls++
      throw new Error('offline')
    },
    schedule: () =>
      1 as unknown as ReturnType<typeof setTimeout>,
    cancel: () => {
      canceled++
    }
  })
  transport.send(event)
  await settle()
  allowed = false
  transport.revoke()
  transport.send(event)
  assert.equal(canceled, 1)
  assert.equal(calls, 1)
})

test('invalid payload and id conflicts are terminal, without blocking caller', async () => {
  let retries = 0
  const transport = createJourneyTransport({
    allowed: () => true,
    fetch: async () => new Response(null, { status: 409 }),
    schedule: () => {
      retries++
      return 1 as unknown as ReturnType<typeof setTimeout>
    }
  })
  assert.doesNotThrow(() => transport.send(event))
  await settle()
  assert.equal(retries, 0)
})
