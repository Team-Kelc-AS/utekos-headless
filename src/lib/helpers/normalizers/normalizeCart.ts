// Path: src/lib/helpers/normalizers/normalizeCart.ts

import type {
  StorefrontCart,
  StorefrontCartLine
} from '@/api/shopify/types/storefrontApi'
import { reshapeProduct } from '@/lib/utils/reshapeProduct'
import { flattenConnection } from '@shopify/hydrogen-react'
import type { Cart, CartLine } from 'types/cart'
import { normalizeProductImage } from './normalizeProductImage'
import { normalizeStorefrontMoney } from './normalizeStorefrontMoney'

const normalizeCartLine = (node: StorefrontCartLine): CartLine => {
  const product = reshapeProduct(node.merchandise.product)
  const featuredImage = normalizeProductImage(
    product.featuredImage,
    product.title
  )

  return {
    id: node.id,
    quantity: node.quantity,
    cost: {
      totalAmount: normalizeStorefrontMoney(node.cost.totalAmount)
    },
    merchandise: {
      id: node.merchandise.id,
      title: node.merchandise.title,
      availableForSale: node.merchandise.availableForSale,
      price: normalizeStorefrontMoney(node.merchandise.price),
      image: node.merchandise.image
        ? normalizeProductImage(node.merchandise.image, product.title)
        : null,
      compareAtPrice: node.merchandise.compareAtPrice
        ? normalizeStorefrontMoney(node.merchandise.compareAtPrice)
        : null,
      selectedOptions: node.merchandise.selectedOptions,
      product: {
        ...product,
        featuredImage
      }
    }
  }
}

export const normalizeCart = (shopifyCart: StorefrontCart): Cart => {
  return {
    id: shopifyCart.id,
    checkoutUrl: shopifyCart.checkoutUrl,
    totalQuantity: shopifyCart.totalQuantity,
    cost: {
      totalAmount: normalizeStorefrontMoney(shopifyCart.cost.totalAmount),
      subtotalAmount: normalizeStorefrontMoney(
        shopifyCart.cost.subtotalAmount
      )
    },
    lines: flattenConnection(shopifyCart.lines).map(normalizeCartLine)
  }
}
