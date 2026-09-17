import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyTrackingGateway } from './verify-tracking-gateway.mjs'

function createFetch({ cacheControl = 'no-store', vercelCache = 'MISS' } = {}) {
  return async url => {
    if (url.includes('/__sgtm/apgqnrnczg.js')) {
      return new Response('/* GTM-5TWMJQFP */', {
        status: 200,
        headers: { 'content-type': 'application/javascript; charset=UTF-8' }
      })
    }

    return new Response('ok', {
      status: 200,
      headers: {
        'cache-control': cacheControl,
        'x-vercel-cache': vercelCache
      }
    })
  }
}

test('accepts a JavaScript GTM response and uncached healthy response', async () => {
  const result = await verifyTrackingGateway({
    baseUrl: 'https://utekos.no/',
    fetchImpl: createFetch()
  })

  assert.equal(result.gtm.status, 200)
  assert.equal(result.sgtm.status, 200)
  assert.equal(result.sgtm.vercelCache, 'MISS')
})

test('rejects a cached sGTM response', async () => {
  await assert.rejects(
    verifyTrackingGateway({
      fetchImpl: createFetch({ cacheControl: 'public, max-age=60', vercelCache: 'HIT' })
    }),
    /missing Cache-Control: no-store/
  )
})
