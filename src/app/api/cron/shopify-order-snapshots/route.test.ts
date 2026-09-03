import assert from 'node:assert/strict'
import Module from 'node:module'
import { createRequire } from 'node:module'
import test from 'node:test'
import type { ShopifyOrderSnapshotCronDependencies } from './route'

const moduleWithLoad = Module as typeof Module & {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown
}
const originalLoad = moduleWithLoad._load.bind(Module)
moduleWithLoad._load = (request, parent, isMain) =>
  request === 'server-only' ?
    {}
  : originalLoad(request, parent, isMain)

const require = createRequire(import.meta.url)
const { handleShopifyOrderSnapshotCron, maxDuration } =
  require('./route.ts') as typeof import('./route')

function request(authorization?: string) {
  return new Request(
    'https://utekos.no/api/cron/shopify-order-snapshots',
    authorization ? { headers: { authorization } } : undefined
  )
}

test('requires CRON_SECRET and exposes a 60 second function budget', async () => {
  assert.equal(maxDuration, 60)
  const dependencies: ShopifyOrderSnapshotCronDependencies = {
    getCronSecret: () => 'correct-secret',
    runSnapshotSync: async () => {
      throw new Error('must not run')
    }
  }

  const response = await handleShopifyOrderSnapshotCron(
    request('Bearer wrong-secret'),
    dependencies
  )
  assert.equal(response.status, 401)
})

test('returns the snapshot-only sync result without provider work', async () => {
  const response = await handleShopifyOrderSnapshotCron(
    request('Bearer correct-secret'),
    {
      getCronSecret: () => 'correct-secret',
      runSnapshotSync: async () => ({
        ok: true,
        status: 'completed',
        windowStart: '2026-07-08T14:10:14.000Z',
        pages: 2,
        ordersExamined: 75,
        snapshotsUpserted: 75
      })
    }
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal((await response.json()).snapshotsUpserted, 75)
})
