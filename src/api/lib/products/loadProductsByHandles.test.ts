import assert from 'node:assert/strict'
import test from 'node:test'
import { loadProductsByHandles } from './loadProductsByHandles'
import type { ShopifyProduct } from 'types/product'

function createProduct(handle: string): ShopifyProduct {
  return { handle, title: handle } as ShopifyProduct
}

test('loads requested handles in order and skips missing products', async () => {
  const requested: string[] = []

  const products = await loadProductsByHandles(
    ['utekos-techdown', 'missing-handle', 'comfyrobe'],
    async handle => {
      requested.push(handle)

      if (handle === 'missing-handle') {
        return null
      }

      return createProduct(handle)
    }
  )

  assert.deepEqual(requested, [
    'utekos-techdown',
    'missing-handle',
    'comfyrobe'
  ])
  assert.deepEqual(
    products.map(product => product.handle),
    ['utekos-techdown', 'comfyrobe']
  )
})
