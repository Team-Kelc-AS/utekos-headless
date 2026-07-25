import assert from 'node:assert/strict'
import test from 'node:test'
import { handleCanonicalPageViewRoute } from './handleCanonicalPageViewRoute'

test('delegates the request to collect exactly once and returns its response', async () => {
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    { method: 'POST' }
  )
  const expectedResponse = new Response(null, { status: 202 })

  let collectCalls = 0
  let collectedRequest: Request | undefined

  const response = await handleCanonicalPageViewRoute(request, {
    collect: async currentRequest => {
      collectCalls += 1
      collectedRequest = currentRequest

      return expectedResponse
    }
  })

  assert.equal(collectCalls, 1)
  assert.equal(collectedRequest, request)
  assert.equal(response, expectedResponse)
})

test('propagates collect errors as rejected promises', async () => {
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    { method: 'POST' }
  )
  const expectedError = new Error('collect failed')

  const result = handleCanonicalPageViewRoute(request, {
    collect: () => {
      throw expectedError
    }
  })

  await assert.rejects(result, error => error === expectedError)
})