import assert from 'node:assert/strict'
import test from 'node:test'
import { createBrowserEventRouteHandler } from './createBrowserEventRouteHandler'

async function invokeHandler(status: number) {
  const collectCalls: Request[] = []
  const request = new Request('https://utekos.no/api/events/page-view', {
    method: 'POST'
  })
  const handleRoute = createBrowserEventRouteHandler()

  const response = await handleRoute(request, {
    classifyTraffic: async () => ({
      classification: 'human_or_unknown',
      excludeFromMarketingDispatch: false
    }),
    collect: async (incoming) => {
      collectCalls.push(incoming)
      return new Response(null, { status })
    }
  })

  return { response, collectCalls, request }
}

test('accepted event returns collect response', async () => {
  const { response, collectCalls, request } = await invokeHandler(202)

  assert.equal(response.status, 202)
  assert.equal(collectCalls.length, 1)
  assert.equal(collectCalls[0], request)
})

test('duplicate or already-processed event returns collect response', async () => {
  const { response, collectCalls, request } = await invokeHandler(200)

  assert.equal(response.status, 200)
  assert.equal(collectCalls.length, 1)
  assert.equal(collectCalls[0], request)
})

test('invalid event returns collect response', async () => {
  const { response, collectCalls, request } = await invokeHandler(400)

  assert.equal(response.status, 400)
  assert.equal(collectCalls.length, 1)
  assert.equal(collectCalls[0], request)
})

test('collect error propagates same Error instance', async () => {
  const expectedError = new Error('collect failed')
  const collectCalls: Request[] = []
  const request = new Request('https://utekos.no/api/events/page-view', {
    method: 'POST'
  })
  const handleRoute = createBrowserEventRouteHandler()

  await assert.rejects(
    handleRoute(request, {
      classifyTraffic: async () => ({
        classification: 'human_or_unknown',
        excludeFromMarketingDispatch: false
      }),
      collect: async (incoming) => {
        collectCalls.push(incoming)
        throw expectedError
      }
    }),
    (error) => error === expectedError
  )

  assert.equal(collectCalls.length, 1)
  assert.equal(collectCalls[0], request)
})

test('handler accepts collect-only dependencies', async () => {
  const collectCalls: Request[] = []
  const request = new Request('https://utekos.no/api/events/filter-apply', {
    method: 'POST'
  })
  const expectedResponse = new Response(null, { status: 202 })
  const handleRoute = createBrowserEventRouteHandler()

  const response = await handleRoute(request, {
    classifyTraffic: async () => ({
      classification: 'human_or_unknown',
      excludeFromMarketingDispatch: false
    }),
    collect: async (incoming) => {
      collectCalls.push(incoming)
      return expectedResponse
    }
  })

  assert.equal(response, expectedResponse)
  assert.equal(response.status, 202)
  assert.equal(collectCalls.length, 1)
  assert.equal(collectCalls[0], request)
})

test('excludes verified automation before collector persistence or dispatch', async () => {
  const request = new Request(
    'https://utekos.no/api/events/page-view',
    { method: 'POST' }
  )
  let collectCalls = 0
  const handleRoute = createBrowserEventRouteHandler()

  const response = await handleRoute(request, {
    classifyTraffic: async () => ({
      classification: 'verified_bot',
      excludeFromMarketingDispatch: true
    }),
    collect: async () => {
      collectCalls += 1
      return new Response(null, { status: 202 })
    }
  })

  assert.equal(response.status, 204)
  assert.equal(
    response.headers.get('x-utekos-traffic-classification'),
    'verified_bot'
  )
  assert.equal(collectCalls, 0)
})
