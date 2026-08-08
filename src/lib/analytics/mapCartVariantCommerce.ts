import {
  mapShopifyViewItem,
  type CanonicalViewItemCommerce,
  type ShopifyPriceContext
} from './shopifyViewItemCommerce'
import type { CartProduct, CartProductVariant } from 'types/cart'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type MapCartVariantCommerceInput = {
  product: CartProduct
  variant: CartProductVariant
  quantity: number
  priceContext: ShopifyPriceContext
}

export function mapCartVariantCommerce({
  product,
  variant,
  quantity,
  priceContext
}: MapCartVariantCommerceInput): CanonicalViewItemCommerce {
  return mapShopifyViewItem({
    product: toCommerceProduct(product),
    variant: toPurchaseVariant(variant),
    quantity,
    priceContext
  })
}

function toCommerceProduct(
  product: CartProduct
): ProductCommerceModel {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    vendor: product.vendor,
    productType: product.productType,
    collections: { nodes: [] }
  }
}

function toPurchaseVariant(
  variant: CartProductVariant
): ProductPurchaseVariant {
  return {
    id: variant.id,
    title: variant.title,
    barcode: null,
    availableForSale: variant.availableForSale,
    currentlyNotInStock: !variant.availableForSale,
    taxable: true,
    selectedOptions: variant.selectedOptions,
    price: variant.price,
    image: variant.image,
    compareAtPrice: variant.compareAtPrice,
    sku: undefined,
    quantityAvailable: null
  }
}
