import assert from 'node:assert/strict'
import test from 'node:test'

import { getMetaCatalogBatchStatus } from './getMetaCatalogBatchStatus'

test('reads one v26 batch status with invalid IDs enabled', async () => {
  let observedUrl = ''
  const fetchImpl: typeof fetch = async input => {
    observedUrl = String(input)

    return Response.json({
      data: [
        {
          handle: 'batch-handle',
          status: 'finished',
          warnings: [],
          warnings_total_count: 0,
          errors: [],
          errors_total_count: 0,
          ids_of_invalid_requests: []
        }
      ]
    })
  }

  const result = await getMetaCatalogBatchStatus({
    accessToken: 'secret-token',
    handle: 'batch-handle',
    fetchImpl
  })
  const url = new URL(observedUrl)

  assert.equal(url.pathname, '/v26.0/690208780604782/check_batch_request_status')
  assert.equal(url.searchParams.get('handle'), 'batch-handle')
  assert.equal(
    url.searchParams.get('load_ids_of_invalid_requests'),
    'true'
  )
  assert.equal(result.status, 'finished')
})
