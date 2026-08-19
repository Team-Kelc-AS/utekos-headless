import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLIENT_LOG_PATH,
  sendClientLog
} from './sendClientLog'
import type { LogPayload } from 'types/observability/log/LogPayload'

const payload: LogPayload = {
  context: { pathname: '/skreddersy-varmen' },
  data: { source: 'window_error', message: 'Script error.' },
  event: 'client_error',
  level: 'error'
}

test('sends JSON with keepalive fetch and skips sendBeacon when fetch resolves', async () => {
  const fetches: Array<{ url: string; init: RequestInit }> = []
  let beaconCalls = 0

  await sendClientLog(payload, {
    fetch: (async (url, init) => {
      fetches.push({ init: init ?? {}, url: String(url) })
      return new Response(null, { status: 204 })
    }) as typeof fetch,
    sendBeacon: () => {
      beaconCalls += 1
      return true
    }
  })

  assert.equal(fetches.length, 1)
  assert.equal(fetches[0]?.url, CLIENT_LOG_PATH)
  assert.equal(fetches[0]?.init.method, 'POST')
  assert.equal(fetches[0]?.init.keepalive, true)
  assert.equal(beaconCalls, 0)
})

test('falls back to a text/plain beacon when fetch rejects', async () => {
  const beacons: Array<{ type: string; url: string }> = []

  await sendClientLog(payload, {
    fetch: (async () => {
      throw new TypeError('Failed to fetch')
    }) as typeof fetch,
    sendBeacon: (url, data) => {
      beacons.push({ type: data.type, url })
      return true
    }
  })

  assert.equal(beacons.length, 1)
  assert.equal(beacons[0]?.url, CLIENT_LOG_PATH)
  assert.match(beacons[0]?.type ?? '', /^text\/plain;charset=utf-8$/i)
})
