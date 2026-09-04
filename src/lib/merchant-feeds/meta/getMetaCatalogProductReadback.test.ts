import assert from 'node:assert/strict'
import test from 'node:test'

import { getMetaCatalogProductReadback } from './getMetaCatalogProductReadback'

test('reads Meta catalog verification fields from the v26 products edge', async () => {
  let request: Request | undefined
  const products = await getMetaCatalogProductReadback({
    accessToken: 'catalog-token',
    fetchImpl: async (input, init) => {
      request = new Request(input, init)

      return Response.json({
        data: [
          {
            id: 'meta-product-id',
            retailer_id: 'variant-id',
            name: 'Utekos TechDown™ Havdyp - Stor',
            category: '5598',
            fb_product_category: '430',
            gtin: '07090062980023',
            manufacturer_part_number: 'TECHDOWN-HAVDYP-L',
            availability: 'in stock',
            visibility: 'published',
            url: 'https://utekos.no/produkter/utekos-techdown'
          }
        ]
      })
    }
  })

  assert.equal(products.length, 1)
  assert.ok(request)
  assert.equal(
    request.url.startsWith(
      'https://graph.facebook.com/v26.0/690208780604782/products?'
    ),
    true
  )
  assert.match(request.url, /category/)
  assert.match(request.url, /manufacturer_part_number/)
  assert.equal(
    request.headers.get('authorization'),
    'Bearer catalog-token'
  )
  assert.equal(request.url.includes('catalog-token'), false)
})

test('follows only an explicit next page with its opaque cursor', async () => {
  const urls: string[] = []
  const products = await getMetaCatalogProductReadback({
    accessToken: 'catalog-token',
    fetchImpl: async input => {
      const url = new URL(input.toString())
      urls.push(url.toString())

      return Response.json(
        url.searchParams.has('after') ?
          { data: [] }
        : {
            data: [],
            paging: {
              cursors: { after: 'opaque-cursor' },
              next: 'https://graph.facebook.com/next-page'
            }
          }
      )
    }
  })

  assert.deepEqual(products, [])
  assert.equal(urls.length, 2)
  assert.equal(
    new URL(urls[1] ?? '').searchParams.get('after'),
    'opaque-cursor'
  )
})
