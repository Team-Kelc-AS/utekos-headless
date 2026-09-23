import type { ProductModel } from '@/lib/products/commerce'
import { getStickyVariantLabel } from './selection'

export type TechdownPurchaseData = {
  initialVariantId: string
  productId: string
  productPath: string
  productName: string
  variants: Array<{
    availableForSale: boolean
    id: string
    label: string
    price: ProductModel['variants'][number]['price']
  }>
}

export function createTechdownPurchaseData(
  product: ProductModel
): TechdownPurchaseData {
  return createStickyCatalogProduct(product, 'Utekos TechDown™')
}

export function createStickyCatalogProduct(
  product: ProductModel,
  productName = product.title
): StickyCatalogProduct {
  return {
    productId: product.id,
    productPath: product.canonicalPath,
    productName,
    initialVariantId: product.defaultVariantId,
    variants: product.variants.map(variant => ({
      id: variant.id,
      label: getStickyVariantLabel(variant.options),
      price: variant.price,
      availableForSale: variant.availableForSale
    }))
  }
}

export type StickyCatalogProduct = TechdownPurchaseData
