import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { getSchemaOrgGtinData } from '@/lib/gtin/getSchemaOrgGtinData'
import type {
  ProductModel,
  ProductVariant
} from '@/lib/products/commerce'

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

const ORGANIZATION_ID = 'https://utekos.no/#organization'

function buildPriceSpecification(variant: ProductVariant) {
  const currentPrice = Number(variant.price.amount)
  const compareAtPrice = Number(variant.compareAtPrice?.amount)

  if (
    !variant.compareAtPrice ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(compareAtPrice) ||
    compareAtPrice <= currentPrice
  ) {
    return undefined
  }

  return {
    '@type': 'UnitPriceSpecification',
    'price': variant.compareAtPrice.amount,
    'priceCurrency': variant.compareAtPrice.currencyCode,
    'priceType': 'https://schema.org/StrikethroughPrice'
  }
}

function buildVariantImage(variant: ProductVariant) {
  const image = variant.image

  if (!image) return undefined

  return {
    '@type': 'ImageObject',
    'contentUrl': image.url,
    'caption': variant.image?.altText,
    'width': image.width,
    'height': image.height
  }
}

function buildVariantNode(
  model: ProductModel,
  variant: ProductVariant
) {
  const validGtin = isValidGtin(variant.barcode)
  const priceSpecification = buildPriceSpecification(variant)
  const image = buildVariantImage(variant)

  return {
    '@type': 'Product',
    '@id': `${model.canonicalUrl}#${variant.publicId}`,
    'name': variant.title,
    'url': variant.publicUrl,
    'description': model.description,
    'brand': { '@type': 'Brand', 'name': 'Utekos' },
    'isVariantOf': { '@id': model.productGroupUrl },
    ...(variant.options.size ?
      { size: variant.options.size }
    : {}),
    ...(variant.options.color ?
      { color: variant.options.color }
    : {}),
    'audience': {
      '@type': 'PeopleAudience',
      'suggestedGender': variant.options.gender ?? model.audience
    },
    ...(variant.sku ? { sku: variant.sku } : {}),
    ...(validGtin ?
      getSchemaOrgGtinData(variant.barcode || '')
    : {}),
    ...(image ? { image } : {}),
    'offers': {
      '@type': 'Offer',
      'url': variant.publicUrl,
      'price': variant.price.amount,
      'priceCurrency': variant.price.currencyCode,
      'availability':
        variant.availableForSale ?
          'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      'itemCondition': 'https://schema.org/NewCondition',
      'seller': { '@id': ORGANIZATION_ID },
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

export function buildProductGroupJsonLd(
  model: ProductModel,
  options: BuildProductGroupJsonLdOptions = {}
) {
  const reviews = options.reviews ?? []
  const colors = [
    ...new Set(
      model.variants
        .map(variant => variant.options.color)
        .filter((value): value is string => Boolean(value))
    )
  ]

  return {
    '@type': 'ProductGroup',
    '@id': model.productGroupUrl,
    'productGroupID': model.handle,
    'name': model.title,
    'description': model.description,
    'url': model.canonicalUrl,
    'brand': { '@type': 'Brand', 'name': 'Utekos' },
    'category': model.productType,
    'material': model.material,
    ...(colors.length === 1 ? { color: colors[0] }
    : colors.length > 1 ? { color: colors }
    : {}),
    'audience': {
      '@type': 'PeopleAudience',
      'suggestedGender': model.audience
    },
    'variesBy': ['https://schema.org/size'],
    'hasVariant': model.variants.map(variant =>
      buildVariantNode(model, variant)
    ),
    ...buildReviewMarkup(
      reviews,
      options.includeAggregateRatingOnly ?? false
    )
  }
}
