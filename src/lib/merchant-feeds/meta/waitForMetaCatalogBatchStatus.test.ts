import assert from 'node:assert/strict'
import test from 'node:test'

import { waitForMetaCatalogBatchStatus } from './waitForMetaCatalogBatchStatus'

test('waits until the v26 batch finishes', async () => {
  let requestCount = 0
  let delayCount = 0
  const fetchImpl: typeof fetch = async () => {
    requestCount += 1

    return Response.json({
      data: [
        {
          handle: 'batch-handle',
          status: requestCount === 1 ? 'in progress' : 'finished',
          warnings: [],
          warnings_total_count: 0,
          errors: [],
          errors_total_count: 0,
          ids_of_invalid_requests: []
        }
      ]
    })
  }

  const result = await waitForMetaCatalogBatchStatus({
    accessToken: 'secret-token',
    handle: 'batch-handle',
    fetchImpl,
    delay: async milliseconds => {
      assert.equal(milliseconds, 2000)
      delayCount += 1
    }
  })

  assert.equal(result.status, 'finished')
  assert.equal(requestCount, 2)
  assert.equal(delayCount, 1)
})

test('fails when Meta returns an invalid request ID', async () => {
  const fetchImpl: typeof fetch = async () =>
    Response.json({
      data: [
        {
          handle: 'batch-handle',
          status: 'finished',
          warnings: [],
          warnings_total_count: 0,
          errors: [{ message: 'invalid title' }],
          errors_total_count: 1,
          ids_of_invalid_requests: ['200']
        }
      ]
    })

  await assert.rejects(
    waitForMetaCatalogBatchStatus({
      accessToken: 'secret-token',
      handle: 'batch-handle',
      fetchImpl,
      delay: async () => undefined
    }),
    /invalid title/
  )
})
