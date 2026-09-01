import type {
  StorefrontProduct,
  StorefrontProductVariant
} from '@/api/shopify/types/storefrontApi'
import { normalizeProductImage } from '@/lib/helpers/normalizers/normalizeProductImage'
import { normalizeStorefrontMoney } from '@/lib/helpers/normalizers/normalizeStorefrontMoney'
import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import type { ShopifyProduct, ShopifyProductVariant } from 'types/product'
import { reshapeMetaobject } from './reshapeMetaobject'

export const reshapeProduct = (product: StorefrontProduct): ShopifyProduct => {
  const variants = flattenConnection(product.variants).map(
    (variant: StorefrontProductVariant): ShopifyProductVariant => {
      const reference = variant.metafield?.reference ?? null

      return {
        id: variant.id,
        title: variant.title,
        barcode: variant.barcode ?? null,
        availableForSale: variant.availableForSale,
        currentlyNotInStock: variant.currentlyNotInStock,
        taxable: variant.taxable,
        selectedOptions: variant.selectedOptions,
        price: normalizeStorefrontMoney(variant.price),
        image: variant.image
          ? normalizeProductImage(variant.image, product.title)
          : null,
        compareAtPrice: variant.compareAtPrice
          ? normalizeStorefrontMoney(variant.compareAtPrice)
          : null,
        metafield: variant.metafield
          ? {
              namespace: 'bridgeFor',
              key: 'VariantHandler',
              reference
            }
          : null,
        sku: variant.sku ?? undefined,
        variantProfile: null,
        ...(reference
          ? { variantProfileData: reshapeMetaobject(reference) }
          : {}),
        weight: null,
        weightUnit: 'GRAMS',
        quantityAvailable: variant.quantityAvailable ?? null
      }
    }
  )

  const selectedOrFirstAvailableVariant =
    variants.find(variant => variant.availableForSale) ?? variants[0]

  const normalizedImages = flattenConnection(product.images).map(node => {
    const image = normalizeProductImage(node, product.title)
    return {
      node: {
        id: image.id,
        image
      }
    }
  })

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    totalInventory: product.totalInventory ?? 0,
    updatedAt: product.updatedAt,
    collections: product.collections,
    compareAtPriceRange: {
      minVariantPrice: normalizeStorefrontMoney(
        product.compareAtPriceRange.minVariantPrice
      ),
      maxVariantPrice: normalizeStorefrontMoney(
        product.compareAtPriceRange.maxVariantPrice
      )
    },
    priceRange: {
      minVariantPrice: normalizeStorefrontMoney(
        product.priceRange.minVariantPrice
      ),
      maxVariantPrice: normalizeStorefrontMoney(
        product.priceRange.maxVariantPrice
      )
    },
    availableForSale: product.availableForSale,
    images: { edges: normalizedImages },
    options: product.options,
    description: product.description,
    featuredImage: normalizeProductImage(product.featuredImage, product.title),
    vendor: product.vendor,
    tags: product.tags,
    relatedProducts: [],
    category: null,
    variantProfile: null,
    seo: {
      title: product.seo.title ?? null,
      description: product.seo.description ?? null
    },
    ...(selectedOrFirstAvailableVariant
      ? { selectedOrFirstAvailableVariant }
      : {}),
    variants: {
      edges: variants.map(variant => ({ node: variant }))
    }
  }
}
