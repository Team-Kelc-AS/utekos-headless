import assert from 'node:assert/strict'
import test from 'node:test'

import {
  handleMetaCatalogSyncCron,
  type MetaCatalogSyncCronDependencies
} from './route'

const syncResult = {
  catalogId: '690208780604782',
  graphApiVersion: 'v26.0',
  offerCount: 8,
  publishedCount: 8,
  deleteCount: 6,
  requestCount: 14,
  publishedGroupCount: 4,
  missingGtinCount: 0,
  missingMpnCount: 0,
  shopifyCheckoutLinkCount: 0,
  imageCount: 70,
  videoCount: 0,
  handle: 'batch-handle',
  validationStatus: [],
  batchStatus: {
    handle: 'batch-handle',
    status: 'finished',
    errors_total_count: 0,
    warnings_total_count: 0,
    ids_of_invalid_requests: [],
    errors: [],
    warnings: []
  }
}

function dependencies(
  overrides: Partial<MetaCatalogSyncCronDependencies> = {}
): MetaCatalogSyncCronDependencies {
  return {
    getAccessToken: () => 'catalog-token',
    getCronSecret: () => 'cron-secret',
    isEnabled: () => true,
    sync: async () => syncResult,
    ...overrides
  }
}

function request(secret = 'cron-secret') {
  return new Request('https://utekos.no/api/cron/meta-catalog-sync', {
    headers: { authorization: `Bearer ${secret}` }
  })
}

test('rejects unauthorized cron requests', async () => {
  const response = await handleMetaCatalogSyncCron(
    request('wrong'),
    dependencies({
      sync: async () => {
        throw new Error('sync must not run')
      }
    })
  )

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { ok: false })
})

test('fails closed while catalog sync is disabled', async () => {
  const response = await handleMetaCatalogSyncCron(
    request(),
    dependencies({
      isEnabled: () => false,
      sync: async () => {
        throw new Error('sync must not run')
      }
    })
  )

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    ok: false,
    reason: 'meta_catalog_sync_disabled'
  })
})

test('fails closed when CATALOG_API_TOKEN is absent', async () => {
  const response = await handleMetaCatalogSyncCron(
    request(),
    dependencies({
      getAccessToken: () => undefined,
      sync: async () => {
        throw new Error('sync must not run')
      }
    })
  )

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), {
    ok: false,
    reason: 'catalog_api_token_missing'
  })
})

test('runs the authorized v26 catalog sync', async () => {
  const response = await handleMetaCatalogSyncCron(
    request(),
    dependencies()
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), {
    ok: true,
    ...syncResult
  })
})
