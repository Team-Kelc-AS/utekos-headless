import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createPostgresWebVitalsStore,
  INSERT_OPS_WEB_VITAL_QUERY
} from './createPostgresWebVitalsStore'

test('createPostgresWebVitalsStore executes insert into ops.web_vitals', async () => {
  const calls: Array<{
    parameters: readonly unknown[]
    query: string
  }> = []
  const store = createPostgresWebVitalsStore(async (query, parameters) => {
    calls.push({ parameters, query })
  })

  await store.insert({
    attribution: { largestShiftTarget: 'img' },
    delta: 0.2,
    entries: [{ value: 0.2 }],
    href: 'https://utekos.no/',
    metric_id: 'v4-cls',
    name: 'CLS',
    navigation_type: 'navigate',
    pathname: '/',
    rating: 'needs-improvement',
    referrer: 'https://google.com/',
    reported_at: '2026-08-19T10:00:00.000Z',
    value: 0.2
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.query, INSERT_OPS_WEB_VITAL_QUERY)
  assert.equal(calls[0]?.parameters[0], 'v4-cls')
  assert.equal(calls[0]?.parameters[1], 'CLS')
  assert.equal(calls[0]?.parameters[2], 0.2)
  assert.equal(calls[0]?.parameters[3], 0.2)
  assert.equal(calls[0]?.parameters[4], 'needs-improvement')
  assert.equal(calls[0]?.parameters[5], '/')
  assert.equal(calls[0]?.parameters[6], 'https://utekos.no/')
  assert.equal(calls[0]?.parameters[7], 'https://google.com/')
  assert.equal(calls[0]?.parameters[8], 'navigate')
  assert.equal(
    calls[0]?.parameters[9],
    JSON.stringify({ largestShiftTarget: 'img' })
  )
  assert.equal(calls[0]?.parameters[10], JSON.stringify([{ value: 0.2 }]))
  assert.equal(calls[0]?.parameters[11], '2026-08-19T10:00:00.000Z')
})
