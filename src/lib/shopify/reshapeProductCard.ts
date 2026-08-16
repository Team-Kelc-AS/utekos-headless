import type { StorefrontProductCard } from '@/api/shopify/types/storefrontApi'
import { normalizeProductImage } from '@/lib/helpers/normalizers/normalizeProductImage'
import { normalizeStorefrontMoney } from '@/lib/helpers/normalizers/normalizeStorefrontMoney'
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'

export function reshapeProductCard(
  product: StorefrontProductCard
): ProductCardModel {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    featuredImage:
      product.featuredImage ?
        normalizeProductImage(product.featuredImage, product.title)
      : null,
    collections: {
      nodes: product.collections.nodes.map(collection => ({
        id: collection.id,
        title: collection.title
      }))
    },
    priceRange: {
      minVariantPrice: normalizeStorefrontMoney(
        product.priceRange.minVariantPrice
      )
    },
    options: product.options.map(option => ({
      name: option.name,
      optionValues: option.optionValues.map(value => ({
        name: value.name
      }))
    })),
    variants: {
      edges: product.variants.edges.map(({ node }) => ({
        node: {
          id: node.id,
          title: node.title,
          barcode: node.barcode ?? null,
          availableForSale: node.availableForSale,
          currentlyNotInStock: node.currentlyNotInStock,
          taxable: node.taxable,
          selectedOptions: node.selectedOptions.map(option => ({
            name: option.name,
            value: option.value
          })),
          price: normalizeStorefrontMoney(node.price),
          image:
            node.image ?
              normalizeProductImage(node.image, product.title)
            : null,
          compareAtPrice:
            node.compareAtPrice ?
              normalizeStorefrontMoney(node.compareAtPrice)
            : null,
          sku: node.sku ?? undefined,
          quantityAvailable: node.quantityAvailable ?? null
        }
      }))
    }
  }
}
