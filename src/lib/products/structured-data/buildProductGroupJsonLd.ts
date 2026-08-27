import { getSchemaOrgGtinData } from '@/lib/gtin/getSchemaOrgGtinData'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { MERCHANT_RETURN_POLICY_ID } from '@/lib/policies/merchantReturnPolicyJsonLd'
import { MERCHANT_SHIPPING_SERVICE_ID } from '@/lib/policies/merchantShippingServiceJsonLd'
import type {
  ProductCommerceViewModel,
  PublicCommerceVariant
} from '@/lib/products/commerce'
import {
  resolveProductStructuredImages,
  type ProductStructuredImage
} from './productStructuredImageManifest'

export type ProductReviewPresentation = {
  name: string
  title?: string
  quote: string
  rating: number
}

type BuildProductGroupJsonLdOptions = {
  reviews?: readonly ProductReviewPresentation[]
  includeAggregateRatingOnly?: boolean
}

type StructuredVariantInput = {
  variant: PublicCommerceVariant
  gtinData: ReturnType<typeof getSchemaOrgGtinData>
  images: readonly ProductStructuredImage[]
}

const ORGANIZATION_ID = 'https://utekos.no/#organization'

function buildPriceSpecification(
  variant: PublicCommerceVariant
) {
  const currentPrice = Number(variant.commerce.price.amount)
  const compareAtPrice = Number(
    variant.commerce.compareAtPrice?.amount
  )

  if (
    !variant.commerce.compareAtPrice ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(compareAtPrice) ||
    compareAtPrice <= currentPrice
  ) {
    return undefined
  }

  return {
    '@type': 'UnitPriceSpecification',
    'price': variant.commerce.compareAtPrice.amount,
    'priceCurrency':
      variant.commerce.compareAtPrice.currencyCode,
    'priceType': 'https://schema.org/StrikethroughPrice'
  }
}

function buildVariantImages(
  images: readonly ProductStructuredImage[]
) {
  return images.map(image => ({
    '@type': 'ImageObject',
    'contentUrl': image.url,
    'caption': image.caption,
    'width': image.width,
    'height': image.height
  }))
}

function resolveStructuredVariants(
  model: ProductCommerceViewModel
): StructuredVariantInput[] {
  return model.variants.flatMap(variant => {
    if (!isValidGtin(variant.commerce.gtin)) {
      return []
    }

    const images = resolveProductStructuredImages({
      gtin: variant.commerce.gtin,
      productKey: model.productKey
    })

    if (images.length === 0) {
      return []
    }

    return [
      {
        variant,
        gtinData: getSchemaOrgGtinData(
          variant.commerce.gtin
        ),
        images
      }
    ]
  })
}

function buildAudience(
  model: ProductCommerceViewModel,
  suggestedGender: string
) {
  return {
    '@type': 'PeopleAudience',
    'suggestedGender': suggestedGender,
    ...(model.suggestedMinAge ?
      { suggestedMinAge: model.suggestedMinAge }
    : {})
  }
}

function buildVariantNode(
  model: ProductCommerceViewModel,
  input: StructuredVariantInput
) {
  const { variant } = input
  const priceSpecification = buildPriceSpecification(variant)

  return {
    '@type': 'Product',
    '@id': `${model.canonicalUrl}#${variant.publicId}`,
    'name': variant.publicName,
    'url': variant.publicUrl,
    'description': variant.description,
    'brand': { '@type': 'Brand', 'name': 'Utekos' },
    'isVariantOf': { '@id': model.productGroupUrl },
    ...(variant.options.size ?
      { size: variant.options.size }
    : {}),
    ...(variant.options.color ?
      { color: variant.options.color }
    : {}),
    'audience': buildAudience(
      model,
      variant.options.gender ?? model.audience
    ),
    ...(variant.commerce.sku ?
      { sku: variant.commerce.sku }
    : {}),
    ...input.gtinData,
    'image': buildVariantImages(input.images),
    'offers': {
      '@type': 'Offer',
      'url': variant.publicUrl,
      'price': variant.commerce.price.amount,
      'priceCurrency': variant.commerce.price.currencyCode,
      'availability':
        variant.commerce.availableForSale ?
          'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      'itemCondition': 'https://schema.org/NewCondition',
      'seller': { '@id': ORGANIZATION_ID },
      'shippingDetails': {
        '@type': 'OfferShippingDetails',
        'hasShippingService': {
          '@id': MERCHANT_SHIPPING_SERVICE_ID
        }
      },
      'hasMerchantReturnPolicy': {
        '@id': MERCHANT_RETURN_POLICY_ID
      },
      ...(priceSpecification ? { priceSpecification } : {})
    }
  }
}

function buildReviewMarkup(
  reviews: readonly ProductReviewPresentation[],
  includeAggregateRatingOnly: boolean
) {
  if (reviews.length === 0) return {}

  const ratingValue =
    reviews.reduce((total, review) => total + review.rating, 0) /
    reviews.length
  const aggregateRating = {
    '@type': 'AggregateRating',
    'ratingValue': Number(ratingValue.toFixed(2)),
    'reviewCount': reviews.length,
    'ratingCount': reviews.length,
    'bestRating': 5,
    'worstRating': 1
  }

  if (includeAggregateRatingOnly) {
    return { aggregateRating }
  }

  return {
    aggregateRating,
    review: reviews.map(review => ({
      '@type': 'Review',
      ...(review.title ? { name: review.title } : {}),
      'author': { '@type': 'Person', 'name': review.name },
      'publisher': { '@id': ORGANIZATION_ID },
      'reviewBody': review.quote,
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': review.rating,
        'bestRating': 5,
        'worstRating': 1
      }
    }))
  }
}

function getDistinctOptionValues(
  variants: readonly StructuredVariantInput[],
  option: 'color' | 'size'
) {
  return [
    ...new Set(
      variants
        .map(({ variant }) => variant.options[option])
        .filter((value): value is string => Boolean(value))
    )
  ]
}

export function buildProductGroupJsonLd(
  model: ProductCommerceViewModel,
  options: BuildProductGroupJsonLdOptions = {}
) {
  const reviews = options.reviews ?? []
  const structuredVariants = resolveStructuredVariants(model)
  const colors = getDistinctOptionValues(
    structuredVariants,
    'color'
  )
  const sizes = getDistinctOptionValues(
    structuredVariants,
    'size'
  )
  const variesBy = [
    ...(sizes.length > 1 ? ['https://schema.org/size'] : []),
    ...(colors.length > 1 ? ['https://schema.org/color'] : [])
  ]

  return {
    '@type': 'ProductGroup',
    '@id': model.productGroupUrl,
    'productGroupID': model.productGroupID,
    'name': model.displayName,
    'description': model.description,
    'url': model.canonicalUrl,
    'brand': { '@type': 'Brand', 'name': 'Utekos' },
    'category': model.category,
    'material': model.material,
    ...(colors.length === 1 ? { color: colors[0] }
    : colors.length > 1 ? { color: colors }
    : {}),
    'audience': buildAudience(model, model.audience),
    ...(variesBy.length > 0 ? { variesBy } : {}),
    'hasVariant': structuredVariants.map(variant =>
      buildVariantNode(model, variant)
    ),
    ...buildReviewMarkup(
      reviews,
      options.includeAggregateRatingOnly ?? false
    )
  }
}
