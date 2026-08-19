import assert from 'node:assert/strict'
import test from 'node:test'
import { mapShopifyCartValueCommerce } from './mapShopifyCartValueCommerce'
import type { Cart } from 'types/cart'

function discountedCart(): Cart {
  return {
    id: 'gid://shopify/Cart/discounted',
    checkoutUrl: 'https://checkout.shopify.com/c/discounted-token',
    totalQuantity: 2,
    cost: {
      subtotalAmount: { amount: '2000', currencyCode: 'NOK' },
      totalAmount: { amount: '1440', currencyCode: 'NOK' },
      totalTaxAmount: { amount: '288', currencyCode: 'NOK' }
    },
    lines: [
      {
        id: 'gid://shopify/CartLine/discounted',
        quantity: 2,
        cost: {
          totalAmount: { amount: '1600', currencyCode: 'NOK' }
        },
        merchandise: {
          id: 'gid://shopify/ProductVariant/discounted',
          title: 'Stor',
          availableForSale: true,
          selectedOptions: [{ name: 'Størrelse', value: 'Stor' }],
          price: { amount: '1000', currencyCode: 'NOK' },
          compareAtPrice: null,
          image: null,
          product: {
            id: 'gid://shopify/Product/discounted',
            handle: 'discounted',
            title: 'Rabattert produkt',
            vendor: 'Utekos',
            productType: 'Yttertøy'
          }
        }
      }
    ]
  } as unknown as Cart
}

test('uses final cart and line costs after all discounts', () => {
  const commerce = mapShopifyCartValueCommerce(discountedCart())

  assert.equal(commerce.gross_value, 1440)
  assert.equal(commerce.value, 1152)
  assert.equal(commerce.tax_value, 288)
  assert.equal(commerce.items[0]?.gross_unit_price, 720)
  assert.equal(commerce.items[0]?.unit_price, 576)
  assert.equal(commerce.items[0]?.tax_amount, 144)
  assert.equal(commerce.items[0]?.gross_discount, 280)
  assert.equal(commerce.items[0]?.discount, 224)
})

test('rejects line costs in a different currency', () => {
  const cart = discountedCart()
  cart.lines[0]!.cost.totalAmount.currencyCode = 'SEK'

  assert.throws(
    () => mapShopifyCartValueCommerce(cart),
    /same currency/u
  )
})
