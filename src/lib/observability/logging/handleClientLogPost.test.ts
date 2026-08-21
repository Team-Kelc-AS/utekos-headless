import assert from 'node:assert/strict'
import test from 'node:test'
import { handleClientLogPost } from './handleClientLogPost'
import type { AppLogInput } from '@/lib/observability/logging/appLogContract'
import type { AppLogEntry } from 'types/observability/log/AppLogEntry'

const validBody = JSON.stringify({
  context: { pathname: '/skreddersy-varmen' },
  data: {
    message: 'Script error.',
    source: 'window_error'
  },
  event: 'client_error',
  level: 'error'
})

function request(body?: string) {
  return new Request('https://utekos.no/api/log', {
    ...(body === undefined ? {} : { body }),
    method: 'POST'
  })
}

function unusedLogEntry(event: string): AppLogEntry {
  return {
    context: {},
    data: {},
    event,
    id: 'unused',
    level: 'ERROR',
    timestamp: '2026-08-19T21:00:16.000Z'
  }
}

test('acknowledges unreadable Facebook-style empty beacons without logging an error', async () => {
  const logged: AppLogInput[] = []
  const response = await handleClientLogPost(request(''), {
    log: async input => {
      logged.push(input)
      return unusedLogEntry(input.event)
    }
  })

  assert.equal(response.status, 204)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(logged.length, 0)
})

test('rejects contract-invalid JSON with 400', async () => {
  const response = await handleClientLogPost(
    request(JSON.stringify({ event: 'client_error' })),
    {
      log: async () => {
        throw new Error('must not persist invalid payloads')
      }
    }
  )

  assert.equal(response.status, 400)
})

test('persists a valid client error payload', async () => {
  const logged: AppLogInput[] = []
  const response = await handleClientLogPost(request(validBody), {
    log: async input => {
      logged.push(input)
      return unusedLogEntry(input.event)
    }
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(logged[0]?.event, 'client.error')
})

test('returns 500 when a valid payload cannot be persisted', async () => {
  const response = await handleClientLogPost(request(validBody), {
    log: async () => {
      throw new Error('sentry unavailable')
    }
  })

  assert.equal(response.status, 500)
})
