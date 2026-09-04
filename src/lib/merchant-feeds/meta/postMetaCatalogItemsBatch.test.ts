import assert from 'node:assert/strict'
import test from 'node:test'

import { postMetaCatalogItemsBatch } from './postMetaCatalogItemsBatch'
import type { MetaCatalogItemsBatchRequest } from './metaCatalogItemsBatchSchema'

const requests = [
  {
    method: 'UPDATE',
    data: {
      id: '200'
    }
  }
] as unknown as MetaCatalogItemsBatchRequest[]

test('posts to the v26 items_batch endpoint without leaking the token', async () => {
  const observed: {
    body?: URLSearchParams
    headers?: Headers
    url?: string
  } = {}
  const fetchImpl: typeof fetch = async (input, init) => {
    observed.url = String(input)
    observed.headers = new Headers(init?.headers)
    observed.body = init?.body as URLSearchParams

    return Response.json({
      handles: ['batch-handle'],
      validation_status: [
        { retailer_id: '200', warnings: [], errors: [] }
      ]
    })
  }

  const result = await postMetaCatalogItemsBatch({
    accessToken: 'secret-token',
    requests,
    fetchImpl
  })

  assert.equal(
    observed.url,
    'https://graph.facebook.com/v26.0/690208780604782/items_batch'
  )
  assert.doesNotMatch(observed.url ?? '', /secret-token/)
  assert.equal(
    observed.headers?.get('authorization'),
    'Bearer secret-token'
  )
  assert.equal(observed.body?.get('item_type'), 'PRODUCT_ITEM')
  assert.equal(observed.body?.get('allow_upsert'), 'true')
  assert.deepEqual(
    JSON.parse(observed.body?.get('requests') ?? '[]'),
    requests
  )
  assert.equal(result.handles[0], 'batch-handle')
})

test('fails closed on immediate validation errors', async () => {
  const fetchImpl: typeof fetch = async () =>
    Response.json({
      handles: [],
      validation_status: [
        {
          retailer_id: '200',
          warnings: [],
          errors: [{ message: 'invalid item' }]
        }
      ]
    })

  await assert.rejects(
    postMetaCatalogItemsBatch({
      accessToken: 'secret-token',
      requests,
      fetchImpl
    }),
    /invalid item/
  )
})
