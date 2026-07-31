import assert from 'node:assert/strict'
import test from 'node:test'
import {
  providerAdapterRegistry,
  type RegisteredProviderAdapterKey
} from '@/lib/analytics/server/providerAdapterRegistry'
import {
  handleMetaViewItemOutboxCron,
  type MetaViewItemOutboxCronDependencies
} from './route'

const cronUrl =
  'https://utekos.no/api/cron/meta-view-item-dispatch'

const emptySummary = {
  acceptedUnverified: 0,
  claimed: 0,
  deadLettered: 0,
  limitReached: false,
  retryScheduled: 0
}

const providerAdapterKeys = Object.keys(
  providerAdapterRegistry
) as RegisteredProviderAdapterKey[]

function emptyBatchResult(
  overrides: Partial<Record<string, typeof emptySummary>> = {}
) {
  return {
    ...Object.fromEntries(
      providerAdapterKeys.map(key => [key, emptySummary])
    ),
    ...overrides
  } as Awaited<
    ReturnType<
      NonNullable<MetaViewItemOutboxCronDependencies['runBatch']>
    >
  >
}

function request(authorization?: string) {
  return new Request(cronUrl, {
    ...(authorization ? { headers: { authorization } } : {})
  })
}

function dependencies(secret: string | undefined): {
  calls: number[]
  dependencies: MetaViewItemOutboxCronDependencies
} {
  const calls: number[] = []

  return {
    calls,
    dependencies: {
      getCronSecret: () => secret,
      runBatch: async input => {
        calls.push(input.maxItems)

        return emptyBatchResult({
          'google:view_item': {
            acceptedUnverified: 1,
            claimed: 1,
            deadLettered: 0,
            limitReached: false,
            retryScheduled: 0
          },
          'meta:view_item': {
            acceptedUnverified: 2,
            claimed: 3,
            deadLettered: 0,
            limitReached: false,
            retryScheduled: 1
          }
        })
      }
    }
  }
}

test('rejects requests when CRON_SECRET is not configured', async () => {
  const fake = dependencies(undefined)

  const response = await handleMetaViewItemOutboxCron(
    request('Bearer anything'),
    fake.dependencies
  )

  assert.equal(response.status, 401)
  assert.deepEqual(fake.calls, [])
})

test('rejects a request with the wrong bearer secret', async () => {
  const fake = dependencies('correct-secret')

  const response = await handleMetaViewItemOutboxCron(
    request('Bearer wrong-secret'),
    fake.dependencies
  )

  assert.equal(response.status, 401)
  assert.deepEqual(fake.calls, [])
})

test('awaits a bounded batch for an authorized cron request', async () => {
  const fake = dependencies('correct-secret')

  const response = await handleMetaViewItemOutboxCron(
    request('Bearer correct-secret'),
    fake.dependencies
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(fake.calls, [10])
  assert.equal(body.ok, true)
  assert.deepEqual(body['google:view_item'], {
    acceptedUnverified: 1,
    claimed: 1,
    deadLettered: 0,
    limitReached: false,
    retryScheduled: 0
  })
  assert.deepEqual(body['meta:view_item'], {
    acceptedUnverified: 2,
    claimed: 3,
    deadLettered: 0,
    limitReached: false,
    retryScheduled: 1
  })
})

test('propagates worker failure so Vercel records a failed cron', async () => {
  const fake = dependencies('correct-secret')
  fake.dependencies.runBatch = async () => {
    throw new Error('database unavailable')
  }

  await assert.rejects(
    handleMetaViewItemOutboxCron(
      request('Bearer correct-secret'),
      fake.dependencies
    ),
    /database unavailable/
  )
})
