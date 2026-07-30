import 'server-only'

import type {
  ProductCardModel,
  ProductPurchaseModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { ShopifyProduct } from 'types/product'

function mapPurchaseVariant(
  variant: ShopifyProduct['variants']['edges'][number]['node']
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
    quantityAvailable: variant.quantityAvailable,
    ...(variant.variantProfileData ?
      {
        variantProfileData: {
          ...(Array.isArray(variant.variantProfileData.images) ?
            {
              images: variant.variantProfileData.images.map(image => ({
                id: image.id,
                url: image.url,
                altText: image.altText,
                width: image.width,
                height: image.height
              }))
            }
          : {}),
          ...(variant.variantProfileData.subtitle ?
            { subtitle: variant.variantProfileData.subtitle }
          : {}),
          ...(variant.variantProfileData.swatchHexcolorForVariant ?
            {
              swatchHexcolorForVariant:
                variant.variantProfileData.swatchHexcolorForVariant
            }
          : {}),
          ...(variant.variantProfileData.colorLabel ?
            { colorLabel: variant.variantProfileData.colorLabel }
          : {}),
          ...(variant.variantProfileData.backgroundColor ?
            {
              backgroundColor:
                variant.variantProfileData.backgroundColor
            }
          : {}),
          ...(variant.variantProfileData.length ?
            { length: variant.variantProfileData.length }
          : {}),
          ...(variant.variantProfileData.centerToWrist ?
            { centerToWrist: variant.variantProfileData.centerToWrist }
          : {}),
          ...(variant.variantProfileData.flatWidth ?
            { flatWidth: variant.variantProfileData.flatWidth }
          : {})
        }
      }
    : {})
  }
}

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
      mapPurchaseVariant(node)
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
      edges: purchaseModel.variants.map(variant => ({ node: variant }))
    }
  }
}
