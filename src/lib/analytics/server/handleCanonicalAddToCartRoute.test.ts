import assert from 'node:assert/strict'
import test from 'node:test'
import { handleCanonicalAddToCartRoute } from './handleCanonicalAddToCartRoute'

test('delegates the request to collect exactly once and returns its response', async () => {
  const request = new Request(
    'https://utekos.no/api/events/add-to-cart',
    { method: 'POST' }
  )
  const expectedResponse = new Response(null, { status: 202 })

  let collectCalls = 0

  const response = await handleCanonicalAddToCartRoute(request, {
    collect: async currentRequest => {
      collectCalls += 1
      assert.equal(currentRequest, request)

      return expectedResponse
    }
  })

  assert.equal(collectCalls, 1)
  assert.equal(response, expectedResponse)
})

test('propagates collect errors as rejected promises', async () => {
  const request = new Request(
    'https://utekos.no/api/events/add-to-cart',
    { method: 'POST' }
  )
  const expectedError = new Error('collect failed')

  const result = handleCanonicalAddToCartRoute(request, {
    collect: () => {
      throw expectedError
    }
  })

  await assert.rejects(result, error => error === expectedError)
})
