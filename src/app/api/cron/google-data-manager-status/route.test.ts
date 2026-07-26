import assert from 'node:assert/strict'
import test from 'node:test'
import {
  handleGoogleDataManagerStatusCron,
  type GoogleDataManagerStatusCronDependencies
} from './route'

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/google-data-manager-status',
    authorization ? { headers: { authorization } } : undefined
  )
}

const emptySummary = {
  claimed: 0,
  deadLettered: 0,
  limitReached: false,
  processing: 0,
  retried: 0,
  succeeded: 0,
  succeededWithWarnings: 0,
  timedOut: 0,
  unknown: 0
}

test('rejects requests without the configured cron secret', async () => {
  const dependencies: GoogleDataManagerStatusCronDependencies = {
    getCronSecret: () => 'correct-secret',
    runBatch: async () => {
      throw new Error('worker must not run')
    }
  }

  const response = await handleGoogleDataManagerStatusCron(
    request('Bearer wrong-secret'),
    dependencies
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('reconciles twenty requests within its own cron budget', async () => {
  const calls: number[] = []
  const dependencies: GoogleDataManagerStatusCronDependencies = {
    getCronSecret: () => 'correct-secret',
    runBatch: async input => {
      calls.push(input.maxItems)
      return emptySummary
    }
  }

  const response = await handleGoogleDataManagerStatusCron(
    request('Bearer correct-secret'),
    dependencies
  )

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [20])
  assert.deepEqual(await response.json(), {
    ...emptySummary,
    ok: true
  })
})

test('returns a failing cron response when provider status times out', async () => {
  const dependencies: GoogleDataManagerStatusCronDependencies = {
    getCronSecret: () => 'correct-secret',
    runBatch: async () => ({ ...emptySummary, timedOut: 1 })
  }

  const response = await handleGoogleDataManagerStatusCron(
    request('Bearer correct-secret'),
    dependencies
  )

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    ...emptySummary,
    ok: false,
    timedOut: 1
  })
})
