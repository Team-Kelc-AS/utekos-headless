import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

export function toNbccCartProduct(
  product: ShopifyProduct
): ProductCartModel {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
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
    }
  }
}

export function toNbccPurchaseVariant(
  variant: ShopifyProductVariant
): ProductPurchaseVariant {
  return {
    id: variant.id,
    title: variant.title,
    barcode: variant.barcode,
    availableForSale: variant.availableForSale,
    currentlyNotInStock: variant.currentlyNotInStock,
    taxable: variant.taxable,
    selectedOptions: variant.selectedOptions.map(option => ({
      name: option.name,
      value: option.value
    })),
    price: {
      amount: variant.price.amount,
      currencyCode: variant.price.currencyCode
    },
    image:
      variant.image ?
        {
          id: variant.image.id,
          url: variant.image.url,
          altText: variant.image.altText,
          width: variant.image.width,
          height: variant.image.height
        }
      : null,
    compareAtPrice:
      variant.compareAtPrice ?
        {
          amount: variant.compareAtPrice.amount,
          currencyCode: variant.compareAtPrice.currencyCode
        }
      : null,
    sku: variant.sku,
    quantityAvailable: variant.quantityAvailable ?? null
  }
}
