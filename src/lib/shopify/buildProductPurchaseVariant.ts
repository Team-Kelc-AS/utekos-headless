import 'server-only'
import type { ShopifyProduct } from 'types/product'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

export function buildProductPurchaseVariant(
  variant: ShopifyProduct['variants']['edges'][number]['node'],
  { includeProfile = true }: { includeProfile?: boolean } = {}
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
          altText: variant.image.altText ?? '',
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
    ...(includeProfile && variant.variantProfileData ?
      {
        variantProfileData: {
          ...(Array.isArray(variant.variantProfileData.images) ?
            {
              images: variant.variantProfileData.images.map(
                image => ({
                  id: image.id,
                  url: image.url,
                  altText: image.altText ?? '',
                  width: image.width,
                  height: image.height
                })
              )
            }
          : {}),
          ...(variant.variantProfileData.subtitle ?
            { subtitle: variant.variantProfileData.subtitle }
          : {}),
          ...((
            variant.variantProfileData.swatchHexcolorForVariant
          ) ?
            {
              swatchHexcolorForVariant:
                variant.variantProfileData
                  .swatchHexcolorForVariant
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
            {
              centerToWrist:
                variant.variantProfileData.centerToWrist
            }
          : {}),
          ...(variant.variantProfileData.flatWidth ?
            { flatWidth: variant.variantProfileData.flatWidth }
          : {})
        }
      }
    : {})
  }
}
