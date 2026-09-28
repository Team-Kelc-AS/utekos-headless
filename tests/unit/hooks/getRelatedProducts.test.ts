import assert from 'node:assert/strict'
import test from 'node:test'

import { getRelatedProducts } from '@/hooks/getRelatedProducts'
import type { ShopifyProduct } from 'types/product'

function product(handle: string): ShopifyProduct {
  return {
    id: handle,
    handle,
    title: handle
  } as ShopifyProduct
}

const products = [
  product('utekos-dun'),
  product('utekos-mikrofiber'),
  product('utekos-techdown')
]

test('prioritizes Utekos Mikrofiber first for related products by default', () => {
  const relatedProducts = getRelatedProducts(products, 'utekos-techdown')

  assert.deepEqual(
    relatedProducts.map(relatedProduct => relatedProduct.handle),
    ['utekos-mikrofiber', 'utekos-dun']
  )
})

test('prioritizes Utekos TechDown first on the Utekos Mikrofiber product page', () => {
  const relatedProducts = getRelatedProducts(products, 'utekos-mikrofiber')

  assert.deepEqual(
    relatedProducts.map(relatedProduct => relatedProduct.handle),
    ['utekos-techdown', 'utekos-dun']
  )
})

test('applies the limit after prioritizing the first related product', () => {
  const relatedProducts = getRelatedProducts(products, 'utekos-dun', 1)

  assert.deepEqual(
    relatedProducts.map(relatedProduct => relatedProduct.handle),
    ['utekos-mikrofiber']
  )
})
