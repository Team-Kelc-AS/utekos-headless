import assert from 'node:assert/strict'
import { afterEach, describe, it, mock } from 'node:test'
import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { getCartFromMutationPayload } from './getCartFromMutationPayload'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'

const cart = { id: 'gid://shopify/Cart/test' } as StorefrontCart

afterEach(() => {
  mock.restoreAll()
})

describe('getCartFromMutationPayload', () => {
  it('returns the cart when Shopify reports no diagnostics', () => {
    const result = getCartFromMutationPayload('cartLinesAdd', {
      cart,
      userErrors: [],
      warnings: []
    })

    assert.equal(result, cart)
  })

  it('throws ShopifyApiError for a Shopify user error', () => {
    assert.throws(
      () =>
        getCartFromMutationPayload('cartLinesAdd', {
          cart: null,
          userErrors: [
            {
              code: 'INVALID',
              field: ['lines', '0'],
              message: 'Ugyldig variant.'
            }
          ],
          warnings: []
        }),
      (error: unknown) =>
        error instanceof ShopifyApiError
        && error.message === 'Ugyldig variant.'
    )
  })

  it('logs non-blocking warnings and returns Shopifys cart', () => {
    const warn = mock.method(console, 'warn', () => undefined)

    const result = getCartFromMutationPayload('cartLinesAdd', {
      cart,
      userErrors: [],
      warnings: [
        {
          code: 'MERCHANDISE_NOT_ENOUGH_STOCK',
          message: 'Antallet ble redusert.',
          target: 'gid://shopify/ProductVariant/test'
        }
      ]
    })

    assert.equal(result, cart)
    assert.equal(warn.mock.callCount(), 1)
  })

  it('throws when Shopify returns neither errors nor a cart', () => {
    assert.throws(
      () =>
        getCartFromMutationPayload('cartLinesAdd', {
          cart: null,
          userErrors: [],
          warnings: []
        }),
      ShopifyApiError
    )
  })
})
