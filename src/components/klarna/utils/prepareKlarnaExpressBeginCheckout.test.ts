import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareKlarnaExpressBeginCheckout } from './prepareKlarnaExpressBeginCheckout'
import type { Cart } from 'types/cart'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

const cartId = 'gid://shopify/Cart/klarna-express-1'

const minimalProduct = {
  id: 'gid://shopify/Product/1',
  title: 'Utekos TechDown',
  handle: 'utekos-techdown'
} as unknown as ShopifyProduct

const minimalVariant = {
  id: 'gid://shopify/ProductVariant/1',
  title: 'Default Title',
  price: { amount: '2499.00', currencyCode: 'NOK' }
} as unknown as ShopifyProductVariant

const minimalCart = {
  id: cartId,
  checkoutUrl: 'https://checkout.shopify.test/cart',
  totalQuantity: 1,
  cost: {
    totalAmount: { amount: '2499.00', currencyCode: 'NOK' },
    subtotalAmount: { amount: '2499.00', currencyCode: 'NOK' }
  },
  lines: [
    {
      id: 'gid://shopify/CartLine/1',
      quantity: 1,
      cost: {
        totalAmount: { amount: '2499.00', currencyCode: 'NOK' }
      },
      merchandise: {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Default Title',
        price: { amount: '2499.00', currencyCode: 'NOK' },
        product: {
          id: 'gid://shopify/Product/1',
          title: 'Utekos TechDown',
          handle: 'utekos-techdown'
        }
      }
    }
  ]
} as unknown as Cart

test('success reports begin_checkout once and matches cart id', async () => {
  let beginCheckoutReports = 0
  let reportedCheckoutMethod: string | undefined
  let reportedCartId: string | undefined

  const result = await prepareKlarnaExpressBeginCheckout({
    product: minimalProduct,
    variant: minimalVariant,
    quantity: 1,
    contextCartId: cartId,
    addLines: async () => ({
      success: true,
      cart: minimalCart,
      message: 'ok'
    }),
    getCartIdFromCookie: async () => null,
    reportAddToCart: () => () => {},
    reportBeginCheckout: async ({ cart, checkoutMethod }) => {
      beginCheckoutReports += 1
      reportedCheckoutMethod = checkoutMethod
      reportedCartId = cart.id
    }
  })

  assert.equal(result.ok, true)
  if (!result.ok) {
    return
  }

  assert.equal(beginCheckoutReports, 1)
  assert.equal(reportedCheckoutMethod, 'klarna_express')
  assert.equal(reportedCartId, cartId)
  assert.equal(result.shopifyCartId, cartId)
  assert.equal(result.orderPayload.merchant_reference1, cartId)
  assert.equal(result.orderPayload.order_amount, 249900)
})

test('addLines failure skips begin_checkout and authorize inputs', async () => {
  let beginCheckoutReports = 0

  const result = await prepareKlarnaExpressBeginCheckout({
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
    reportAddToCart: () => () => {},
    reportBeginCheckout: async () => {
      beginCheckoutReports += 1
    }
  })

  assert.equal(result.ok, false)
  assert.equal(beginCheckoutReports, 0)
  if (result.ok) {
    return
  }
  assert.equal(result.orderPayload, null)
  assert.equal(result.shopifyCartId, null)
})

test('missing cart after success skips begin_checkout', async () => {
  let beginCheckoutReports = 0

  const result = await prepareKlarnaExpressBeginCheckout({
    product: minimalProduct,
    variant: minimalVariant,
    quantity: 1,
    contextCartId: cartId,
    addLines: async () => ({
      success: true,
      cart: null,
      message: 'ok'
    }),
    getCartIdFromCookie: async () => cartId,
    reportAddToCart: () => () => {},
    reportBeginCheckout: async () => {
      beginCheckoutReports += 1
    }
  })

  assert.equal(result.ok, false)
  assert.equal(beginCheckoutReports, 0)
})
