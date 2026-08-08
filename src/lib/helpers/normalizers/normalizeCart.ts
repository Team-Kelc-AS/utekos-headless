// Path: src/lib/helpers/normalizers/normalizeCart.ts

import type {
  StorefrontCart,
  StorefrontCartLine
} from '@/api/shopify/types/storefrontApi'
import { flattenConnection } from '@shopify/hydrogen-react'
import type { Cart, CartLine } from 'types/cart'
import { normalizeProductImage } from './normalizeProductImage'
import { normalizeStorefrontMoney } from './normalizeStorefrontMoney'
import { parseShopifyCartId } from '@/lib/cart/parseShopifyCartId'
import { CART_CHECKOUT_PATH } from '@/lib/cart/cartCheckoutPath'

const normalizeCartLine = (
  node: StorefrontCartLine
): CartLine => {
  const product = node.merchandise.product
  const cartProduct = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    vendor: product.vendor,
    productType: product.productType
  }

  return {
    id: node.id,
    quantity: node.quantity,
    cost: {
      totalAmount: normalizeStorefrontMoney(
        node.cost.totalAmount
      )
    },
    merchandise: {
      id: node.merchandise.id,
      title: node.merchandise.title,
      availableForSale: node.merchandise.availableForSale,
      price: normalizeStorefrontMoney(node.merchandise.price),
      image:
        node.merchandise.image ?
          normalizeProductImage(
            node.merchandise.image,
            product.title
          )
        : null,
      compareAtPrice:
        node.merchandise.compareAtPrice ?
          normalizeStorefrontMoney(
            node.merchandise.compareAtPrice
          )
        : null,
      selectedOptions: node.merchandise.selectedOptions,
      product: cartProduct
    }
  }
}

export const normalizeCart = (
  shopifyCart: StorefrontCart
): Cart => {
  const publicCartId = parseShopifyCartId(
    shopifyCart.id
  )?.publicId
  if (!publicCartId) {
    throw new Error(
      'Shopify returned an invalid cart identifier.'
    )
  }

  return {
    id: publicCartId,
    // The Shopify checkout URL contains the same capability key as the
    // authenticated cart id. Keep it server-side until checkout navigation.
    checkoutUrl: CART_CHECKOUT_PATH,
    totalQuantity: shopifyCart.totalQuantity,
    cost: {
      totalAmount: normalizeStorefrontMoney(
        shopifyCart.cost.totalAmount
      ),
      subtotalAmount: normalizeStorefrontMoney(
        shopifyCart.cost.subtotalAmount
      )
    },
    lines: flattenConnection(shopifyCart.lines).map(
      normalizeCartLine
    )
  }
}
