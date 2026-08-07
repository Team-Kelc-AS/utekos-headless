import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)

moduleWithLoad._load = (request, parent, isMain) => {
  if (request === 'server-only') {
    return {}
  }

  if (
    request === '@sentry/nextjs' ||
    request.endsWith('/@sentry/nextjs')
  ) {
    return {
      getCurrentScope: () => ({
        setTag: () => undefined
      })
    }
  }

  return originalLoad(request, parent, isMain)
}

const require = createRequire(import.meta.url)
const { handleDunWaitlistShopifySyncCron } = require(
  './route.ts'
) as typeof import('./route')

type CronDependencies = Parameters<
  typeof handleDunWaitlistShopifySyncCron
>[1]

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/shopify-dun-waitlist-sync',
    authorization ? { headers: { authorization } } : undefined
  )
}

const legacySummary = {
  claimed: 2,
  deadLettered: 0,
  enqueued: 1,
  limitReached: false,
  retryScheduled: 0,
  succeeded: 1
}

const pgmqSummary = {
  read: 3,
  succeeded: 1,
  alreadySatisfied: 1,
  retryScheduled: 1,
  deadLettered: 0,
  invalid: 0,
  leadNotFound: 0,
  failed: 0,
  archived: 2
}

const queueMetrics = {
  queueLength: 1,
  newestMsgAgeSec: 5,
  oldestMsgAgeSec: 5,
  totalMessages: 10,
  visibleCount: 1,
  delayedCount: 0,
  oldestVisibleAgeSec: 5,
  oldestDelayedVt: null,
  healthLevel: 'healthy' as const
}

function baseDependencies(
  overrides: Partial<NonNullable<CronDependencies>> = {}
): NonNullable<CronDependencies> {
  return {
    getCronSecret: () => 'correct-secret',
    getBackend: () => 'legacy',
    runLegacyBatch: async () => {
      throw new Error('legacy must not run')
    },
    runPgmqBatch: async () => {
      throw new Error('pgmq must not run')
    },
    getQueueMetrics: async () => queueMetrics,
    setBackendTag: () => undefined,
    ...overrides
  }
}

test('rejects requests without the configured cron secret', async () => {
  const response = await handleDunWaitlistShopifySyncCron(
    request('Bearer wrong-secret'),
    baseDependencies()
  )

  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('routes legacy backend exclusively to the legacy runner', async () => {
  const tags: string[] = []
  let legacyCalls = 0
  let pgmqCalls = 0

  const response = await handleDunWaitlistShopifySyncCron(
    request('Bearer correct-secret'),
    baseDependencies({
      getBackend: () => 'legacy',
      runLegacyBatch: async input => {
        legacyCalls += 1
        assert.equal(input.maxItems, 10)
        return legacySummary
      },
      runPgmqBatch: async () => {
        pgmqCalls += 1
        return pgmqSummary
      },
      setBackendTag: backend => {
        tags.push(backend)
      }
    })
  )

  assert.equal(response.status, 200)
  assert.equal(legacyCalls, 1)
  assert.equal(pgmqCalls, 0)
  assert.deepEqual(tags, ['legacy'])
  assert.deepEqual(await response.json(), {
    ...legacySummary,
    backend: 'legacy',
    ok: true
  })
})

test('routes pgmq backend exclusively to the PGMQ runner', async () => {
  let legacyCalls = 0
  let pgmqCalls = 0

  const response = await handleDunWaitlistShopifySyncCron(
    request('Bearer correct-secret'),
    baseDependencies({
      getBackend: () => 'pgmq',
      runLegacyBatch: async () => {
        legacyCalls += 1
        return legacySummary
      },
      runPgmqBatch: async input => {
        pgmqCalls += 1
        assert.equal(input.maxItems, 10)
        return pgmqSummary
      }
    })
  )

  assert.equal(response.status, 200)
  assert.equal(legacyCalls, 0)
  assert.equal(pgmqCalls, 1)
  assert.deepEqual(await response.json(), {
    ...pgmqSummary,
    backend: 'pgmq',
    ok: true,
    queueMetrics
  })
})

test('fails closed on invalid backend without calling either runner', async () => {
  let legacyCalls = 0
  let pgmqCalls = 0

  const response = await handleDunWaitlistShopifySyncCron(
    request('Bearer correct-secret'),
    baseDependencies({
      getBackend: () => {
        throw new Error('invalid')
      },
      runLegacyBatch: async () => {
        legacyCalls += 1
        return legacySummary
      },
      runPgmqBatch: async () => {
        pgmqCalls += 1
        return pgmqSummary
      }
    })
  )

  assert.equal(response.status, 500)
  assert.equal(legacyCalls, 0)
  assert.equal(pgmqCalls, 0)
  assert.deepEqual(await response.json(), {
    ok: false,
    error: 'invalid_dun_waitlist_sync_backend'
  })
})

test('pgmq response remains PII-free when metrics lookup fails', async () => {
  const response = await handleDunWaitlistShopifySyncCron(
    request('Bearer correct-secret'),
    baseDependencies({
      getBackend: () => 'pgmq',
      runPgmqBatch: async () => pgmqSummary,
      getQueueMetrics: async () => {
        throw new Error('metrics unavailable')
      }
    })
  )

  const body = (await response.json()) as Record<string, unknown>
  assert.equal(response.status, 200)
  assert.equal(body.backend, 'pgmq')
  assert.equal(body.ok, true)
  assert.equal(body.queueMetrics, undefined)
  assert.equal('email' in body, false)
  assert.equal('lead_id' in body, false)
})
