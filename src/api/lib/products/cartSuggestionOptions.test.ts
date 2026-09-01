import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchProductSuggestions } from './cartSuggestionOptions'

test('fetches product suggestions through the GET route', async t => {
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async input => {
    requestedUrls.push(String(input))
    return Response.json([
      {
        id: 'gid://shopify/Product/1',
        handle: 'utekos-techdown',
        title: 'Utekos TechDown'
      }
    ])
  }

  const products = await fetchProductSuggestions('recommended')

  assert.deepEqual(requestedUrls, [
    '/api/products/suggestions/recommended'
  ])
  assert.equal(products[0]?.handle, 'utekos-techdown')
})

test('rejects an unsuccessful suggestion response', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () =>
    Response.json({ error: 'product_fetch_failed' }, { status: 502 })

  await assert.rejects(
    fetchProductSuggestions('accessory'),
    /Product suggestions request failed: 502/
  )
})
