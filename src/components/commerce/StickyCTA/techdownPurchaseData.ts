import type { ProductModel } from '@/lib/products/commerce'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
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
  checkout: {
    product: ProductCartModel
    variants: ProductPurchaseVariant[]
  }
}

function toCartProduct(product: ProductModel): ProductCartModel {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    collections: product.collections,
    featuredImage: product.featuredImage
  }
}

function toPurchaseVariant(
  variant: ProductModel['variants'][number]
): ProductPurchaseVariant {
  return {
    id: variant.id,
    title: variant.title,
    barcode: variant.barcode,
    availableForSale: variant.availableForSale,
    currentlyNotInStock: variant.currentlyNotInStock,
    taxable: variant.taxable,
    selectedOptions: variant.selectedOptions,
    price: variant.price,
    image: variant.image,
    compareAtPrice: variant.compareAtPrice,
    quantityAvailable: variant.quantityAvailable,
    ...(variant.sku ? { sku: variant.sku } : {}),
    ...(variant.variantProfileData ?
      { variantProfileData: variant.variantProfileData }
    : {})
  }
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
    })),
    checkout: {
      product: toCartProduct(product),
      variants: product.variants.map(toPurchaseVariant)
    }
  }
}

export type StickyCatalogProduct = TechdownPurchaseData
