import 'server-only'

import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { buildProductPurchaseVariant } from '@/lib/shopify/buildProductPurchaseVariant'
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
import { TECH_DOWN_PUBLIC_SIZES } from '../techDownSizes'
import {
  productModelSchema,
  type ProductModel,
  type ProductVariant
} from '../productModelSchema'
import type { ShopifyProduct } from 'types/product'

function mapImage(
  image: ShopifyProduct['featuredImage'],
  altText: string
) {
  return image ?
      { ...image, url: resolveImageSrc(image.url), altText }
    : null
}

export function buildProductModel(
  rawProduct: ShopifyProduct,
  {
    includeVariantProfiles = false
  }: { includeVariantProfiles?: boolean } = {}
): ProductModel {
  const presentation = requireProductPresentation(
    rawProduct.handle
  )
  const variants = rawProduct.variants.edges.flatMap(
    ({ node }): ProductVariant[] => {
      const options = resolvePublicVariantOptions(
        presentation,
        node.selectedOptions
      )
      if (
        !options ||
        isHiddenPublicVariant(presentation, options)
      )
        return []

      const title = buildPublicVariantName(presentation, options)
      const publicPath = buildPublicVariantUrl({
        presentation,
        options
      })
      const suffix = [
        options.color,
        options.size,
        options.gender
      ]
        .filter((value): value is string => Boolean(value))
        .map(slugifyVariantOption)
        .join('-')

      return [
        {
          ...buildProductPurchaseVariant(node, {
            includeProfile: includeVariantProfiles
          }),
          title,
          publicId: `variant-${suffix || 'default'}`,
          publicPath,
          publicUrl: `https://utekos.no${publicPath}`,
          options,
          selectedOptions: toPublicSelectedOptions(
            presentation,
            options
          ),
          image: mapImage(
            node.image ?? rawProduct.featuredImage,
            buildPublicVariantImageAlt(presentation, options)
          ),
          sku: node.sku?.trim() || undefined
        }
      ]
    }
  )

  if (presentation.publicHandle === 'utekos-techdown') {
    const sizes = new Set(
      variants.map(variant => variant.options.size)
    )
    if (
      sizes.size !== TECH_DOWN_PUBLIC_SIZES.length ||
      !TECH_DOWN_PUBLIC_SIZES.every(size => sizes.has(size))
    ) {
      throw new Error(
        `TechDown product does not match the public size contract (expected: ${TECH_DOWN_PUBLIC_SIZES.join(', ')}; received: ${[...sizes].join(', ')})`
      )
    }
  }

  const defaultVariant =
    variants.find(
      variant =>
        variant.options.size === 'Stor' &&
        variant.availableForSale
    ) ??
    variants.find(variant => variant.availableForSale) ??
    variants[0]
  if (!defaultVariant)
    throw new Error(
      `No public variants could be built for ${presentation.publicHandle}`
    )

  const options = presentation.options.map(option => ({
    name: option.publicName,
    optionValues: [
      ...new Set(
        variants
          .map(variant => variant.options[option.key])
          .filter((value): value is string => Boolean(value))
      )
    ].map(name => ({ name }))
  }))

  return productModelSchema.parse({
    id: rawProduct.id,
    title: presentation.displayName,
    handle: presentation.publicHandle,
    productType: presentation.category,
    vendor: 'Utekos',
    totalInventory: rawProduct.totalInventory,
    featuredImage: mapImage(
      rawProduct.featuredImage,
      presentation.media.defaultAlt
    ),
    collections: {
      nodes: rawProduct.collections.nodes.map(
        ({ id, title }) => ({ id, title })
      )
    },
    canonicalPath: presentation.canonicalPath,
    canonicalUrl: presentation.canonicalUrl,
    productGroupUrl: presentation.productGroupUrl,
    description: presentation.description,
    material: presentation.material,
    audience: presentation.audience,
    updatedAt: rawProduct.updatedAt,
    options,
    variants,
    defaultVariantId: defaultVariant.id
  })
}
