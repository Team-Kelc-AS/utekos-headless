import assert from 'node:assert/strict'
import test from 'node:test'

import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { isShopifyCartNotFoundError } from './isShopifyCartNotFoundError'

test('recognizes Shopify cartId user errors', () => {
  const error = new ShopifyApiError('Cart mutation failed', [
    {
      message: 'Den angitte handlekurven finnes ikke.',
      extensions: {
        code: 'INVALID',
        field: ['cartId']
      }
    }
  ])

  assert.equal(isShopifyCartNotFoundError(error), true)
})

test('recognizes the documented English cart-not-found message', () => {
  const error = new ShopifyApiError(
    'The specified cart does not exist.'
  )

  assert.equal(isShopifyCartNotFoundError(error), true)
})

test('does not recover unrelated Shopify failures', () => {
  const error = new ShopifyApiError('Variant is sold out', [
    {
      message: 'Variant is sold out',
      extensions: {
        code: 'INVALID',
        field: ['lines', '0', 'merchandiseId']
      }
    }
  ])

  assert.equal(isShopifyCartNotFoundError(error), false)
})
