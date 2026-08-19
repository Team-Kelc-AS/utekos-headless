import type { PublicCommerceVariant } from './productCommerceViewModelSchema'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

export function toPurchaseVariantFromPublicCommerce(
  variant: PublicCommerceVariant
): ProductPurchaseVariant {
  return {
    id: variant.commerce.id,
    title: variant.commerce.title,
    barcode: variant.commerce.gtin,
    availableForSale: variant.commerce.availableForSale,
    currentlyNotInStock: variant.commerce.currentlyNotInStock,
    taxable: variant.commerce.taxable,
    selectedOptions: variant.commerce.selectedOptions,
    price: variant.commerce.price,
    image: variant.commerce.image,
    compareAtPrice: variant.commerce.compareAtPrice,
    sku: variant.commerce.sku,
    quantityAvailable: variant.commerce.quantityAvailable
  }
}
