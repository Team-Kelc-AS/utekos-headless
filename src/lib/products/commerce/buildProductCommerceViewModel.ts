import 'server-only'

import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import {
  buildPublicVariantImageAlt,
  buildPublicVariantName,
  buildPublicVariantUrl,
  isHiddenPublicVariant,
  requireProductPresentation,
  resolvePublicVariantOptions,
  toPublicSelectedOptions
} from '@/lib/products/presentation'
import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'
import {
  productCommerceViewModelSchema,
  type ProductCommerceViewModel,
  type PublicCommerceVariant
} from './productCommerceViewModelSchema'
import type { ShopifyProduct } from 'types/product'

function mapImage(
  image: ShopifyProduct['featuredImage'],
  altText: string
) {
  if (!image) return null

  return {
    id: image.id,
    url: resolveImageSrc(image.url),
    altText,
    width: image.width,
    height: image.height
  }
}

function buildPublicVariantId(
  options: PublicCommerceVariant['options']
) {
  const suffix = [options.color, options.size, options.gender]
    .filter((value): value is string => Boolean(value))
    .map(slugifyVariantOption)
    .join('-')

  return `variant-${suffix || 'default'}`
}

function chooseDefaultVariant(
  variants: PublicCommerceVariant[]
) {
  const preferred = variants.find(
    variant =>
      variant.options.size === 'Stor' &&
      variant.commerce.availableForSale
  )
  const firstAvailable = variants.find(
    variant => variant.commerce.availableForSale
  )

  return preferred ?? firstAvailable ?? variants[0]
}

export function buildProductCommerceViewModel(
  rawProduct: ShopifyProduct,
  publicHandle = rawProduct.handle
): ProductCommerceViewModel {
  const presentation = requireProductPresentation(publicHandle)

  const variants = rawProduct.variants.edges.flatMap(
    ({ node: variant }): PublicCommerceVariant[] => {
      const options = resolvePublicVariantOptions(
        presentation,
        variant.selectedOptions
      )

      if (!options || isHiddenPublicVariant(presentation, options)) {
        return []
      }

      const publicName = buildPublicVariantName(
        presentation,
        options
      )
      const imageAlt = buildPublicVariantImageAlt(
        presentation,
        options
      )
      const publicPath = buildPublicVariantUrl({
        presentation,
        options
      })

      return [
        {
          publicId: buildPublicVariantId(options),
          publicPath,
          publicUrl: `https://utekos.no${publicPath}`,
          publicName,
          imageAlt,
          options,
          commerce: {
            id: variant.id,
            title: publicName,
            barcode: variant.barcode,
            availableForSale: variant.availableForSale,
            currentlyNotInStock: variant.currentlyNotInStock,
            taxable: variant.taxable,
            selectedOptions: toPublicSelectedOptions(
              presentation,
              options
            ),
            price: {
              amount: String(variant.price.amount),
              currencyCode: variant.price.currencyCode
            },
            image: mapImage(
              variant.image ?? rawProduct.featuredImage,
              imageAlt
            ),
            compareAtPrice:
              variant.compareAtPrice ?
                {
                  amount: String(variant.compareAtPrice.amount),
                  currencyCode:
                    variant.compareAtPrice.currencyCode
                }
              : null,
            ...(variant.sku?.trim() ? { sku: variant.sku.trim() } : {}),
            quantityAvailable: variant.quantityAvailable
          }
        }
      ]
    }
  )

  if (variants.length === 0) {
    throw new Error(
      `No public variants could be built for ${presentation.productKey}`
    )
  }

  const defaultVariant = chooseDefaultVariant(variants)

  if (!defaultVariant) {
    throw new Error(
      `No default public variant exists for ${presentation.productKey}`
    )
  }

  return productCommerceViewModelSchema.parse({
    productKey: presentation.productKey,
    publicHandle: presentation.publicHandle,
    canonicalPath: presentation.canonicalPath,
    canonicalUrl: presentation.canonicalUrl,
    productGroupID: presentation.productGroupID,
    productGroupUrl: presentation.productGroupUrl,
    displayName: presentation.displayName,
    description: presentation.description,
    category: presentation.category,
    material: presentation.material,
    audience: presentation.audience,
    updatedAt: rawProduct.updatedAt,
    product: {
      id: rawProduct.id,
      title: presentation.displayName,
      handle: presentation.publicHandle,
      productType: presentation.category,
      vendor: 'Utekos',
      featuredImage: mapImage(
        rawProduct.featuredImage,
        presentation.media.defaultAlt
      ),
      collections: {
        nodes: rawProduct.collections.nodes.map(collection => ({
          id: collection.id,
          title: collection.title
        }))
      }
    },
    variants,
    defaultVariantId: defaultVariant.commerce.id
  })
}
