import assert from 'node:assert/strict'
import test from 'node:test'
import { addProductLineAndReportAddToCart } from '@/lib/analytics/addProductLineAndReportAddToCart'
import type { Cart } from 'types/cart'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

const minimalProduct = {
  id: 'gid://shopify/Product/1',
  title: 'Test Product',
  handle: 'test-product'
} as unknown as ShopifyProduct

const minimalVariant = {
  id: 'gid://shopify/ProductVariant/1',
  title: 'Default',
  price: { amount: '100', currencyCode: 'NOK' }
} as unknown as ShopifyProductVariant

test('reports only after successful addLines', async () => {
  let reported = 0
  const result = await addProductLineAndReportAddToCart({
    product: minimalProduct,
    variant: minimalVariant,
    quantity: 1,
    contextCartId: 'gid://shopify/Cart/1',
    addLines: async () => ({
      success: true,
      cart: { id: 'gid://shopify/Cart/1' } as Cart,
      message: 'ok'
    }),
    getCartIdFromCookie: async () => null,
    report: () => {
      reported += 1
      return () => {}
    }
  })
  assert.equal(result.success, true)
  assert.equal(reported, 1)
})

test('does not report when addLines fails', async () => {
  let reported = 0
  const result = await addProductLineAndReportAddToCart({
    product: minimalProduct,
    variant: minimalVariant,
    quantity: 1,
    contextCartId: null,
    addLines: async () => ({
      success: false,
      cart: null,
      message: 'fail',
      error: 'fail'
    }),
    getCartIdFromCookie: async () => null,
    report: () => {
      reported += 1
      return () => {}
    }
  })
  assert.equal(result.success, false)
  assert.equal(reported, 0)
})

test('resolves cartId from cookie when mutation cart id missing', async () => {
  let reportedCartId: string | undefined
  const result = await addProductLineAndReportAddToCart({
    product: minimalProduct,
    variant: minimalVariant,
    quantity: 2,
    contextCartId: null,
    addLines: async () => ({
      success: true,
      cart: null,
      message: 'ok'
    }),
    getCartIdFromCookie: async () => 'gid://shopify/Cart/cookie',
    report: input => {
      reportedCartId = input.cartId
      return () => {}
    }
  })
  assert.equal(result.success, true)
  assert.equal(reportedCartId, 'gid://shopify/Cart/cookie')
  assert.equal(result.cartId, 'gid://shopify/Cart/cookie')
})
