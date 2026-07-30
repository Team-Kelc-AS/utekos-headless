import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'

import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { ShopifyApiError } from '@/lib/errors/ShopifyApiError'
import { performCartCommand } from './performCartCommand'

const existingCartId =
  'gid://shopify/Cart/existing?key=existing-key'
const replacementCart = {
  id: 'gid://shopify/Cart/replacement?key=replacement-key'
} as StorefrontCart
const lines = [
  {
    variantId: 'gid://shopify/ProductVariant/1',
    quantity: 1
  }
]

function createDependencies() {
  return {
    clearCart: mock.fn(async () => replacementCart),
    createCart: mock.fn(async () => replacementCart),
    updateDiscountCodes: mock.fn(async () => replacementCart),
    addLines: mock.fn(async () => replacementCart),
    removeLines: mock.fn(async () => replacementCart),
    updateLines: mock.fn(async () => replacementCart)
  }
}

describe('performCartCommand add-lines recovery', () => {
  it('creates a replacement cart when Shopify rejects a stale cart id', async () => {
    const dependencies = createDependencies()
    dependencies.addLines.mock.mockImplementationOnce(async () => {
      throw new ShopifyApiError('Cart mutation failed', [
        {
          message: 'Den angitte handlekurven finnes ikke.',
          extensions: {
            code: 'INVALID',
            field: ['cartId']
          }
        }
      ])
    })

    const result = await performCartCommand(
      { type: 'add-lines', lines },
      existingCartId,
      dependencies
    )

    assert.equal(result, replacementCart)
    assert.equal(dependencies.addLines.mock.callCount(), 1)
    assert.equal(dependencies.createCart.mock.callCount(), 1)
    assert.deepEqual(
      dependencies.createCart.mock.calls[0]?.arguments,
      [lines, undefined]
    )
  })

  it('preserves a discount code when replacing a stale cart', async () => {
    const dependencies = createDependencies()
    dependencies.addLines.mock.mockImplementationOnce(async () => {
      throw new ShopifyApiError(
        'The specified cart does not exist.'
      )
    })

    await performCartCommand(
      { type: 'add-lines', lines, discountCode: 'STAYCOMFY' },
      existingCartId,
      dependencies
    )

    assert.deepEqual(
      dependencies.createCart.mock.calls[0]?.arguments,
      [lines, 'STAYCOMFY']
    )
  })

  it('does not replace a cart for unrelated Shopify errors', async () => {
    const dependencies = createDependencies()
    const error = new ShopifyApiError('Variant is sold out')
    dependencies.addLines.mock.mockImplementationOnce(async () => {
      throw error
    })

    await assert.rejects(
      performCartCommand(
        { type: 'add-lines', lines },
        existingCartId,
        dependencies
      ),
      error
    )
    assert.equal(dependencies.createCart.mock.callCount(), 0)
  })
})
