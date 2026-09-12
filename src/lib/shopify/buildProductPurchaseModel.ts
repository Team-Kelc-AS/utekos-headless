import 'server-only'
import { buildProductPurchaseVariant } from './buildProductPurchaseVariant'

import type {
  ProductCardModel,
  ProductPurchaseModel
} from 'types/product/ProductPurchaseModel'
import type { ShopifyProduct } from 'types/product'

export function buildProductPurchaseModel(
  product: ShopifyProduct
): ProductPurchaseModel {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    totalInventory: product.totalInventory,
    featuredImage:
      product.featuredImage ?
        {
          id: product.featuredImage.id,
          url: product.featuredImage.url,
          altText: product.featuredImage.altText,
          width: product.featuredImage.width,
          height: product.featuredImage.height
        }
      : null,
    collections: {
      nodes: product.collections.nodes.map(collection => ({
        id: collection.id,
        title: collection.title
      }))
    },
    options: product.options.map(option => ({
      name: option.name,
      optionValues: option.optionValues.map(value => ({
        name: value.name
      }))
    })),
    variants: product.variants.edges.map(({ node }) =>
      buildProductPurchaseVariant(node)
    )
  }
}

export function buildProductCardModel(
  product: ShopifyProduct
): ProductCardModel {
  const purchaseModel = buildProductPurchaseModel(product)

  return {
    id: purchaseModel.id,
    title: purchaseModel.title,
    handle: purchaseModel.handle,
    productType: purchaseModel.productType,
    vendor: purchaseModel.vendor,
    featuredImage: purchaseModel.featuredImage,
    collections: purchaseModel.collections,
    priceRange: {
      minVariantPrice: {
        amount: product.priceRange.minVariantPrice.amount,
        currencyCode:
          product.priceRange.minVariantPrice.currencyCode
      }
    },
    options: purchaseModel.options,
    variants: {
      edges: purchaseModel.variants.map(variant => ({
        node: variant
      }))
    }
  }
}
