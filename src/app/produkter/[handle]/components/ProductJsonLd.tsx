import { getProduct } from '@/api/lib/products/getProduct'
import { reshapeProductWithMetafields } from '@/hooks/useProductWithMetafields'
import { computeVariantImages } from '@/lib/utils/computeVariantImages'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'
import { getSchemaOrgGtinData } from '@/lib/gtin/getSchemaOrgGtinData'
import { productReviewBundles } from '@/db/data/reviews/productReviews'
import { getProductPageDescriptionText } from '@/db/data/products/product-page-content'
import { cacheLife, cacheTag } from 'next/cache'
import type {
  AggregateRating,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Product as ProductSchema,
  ProductGroup,
  Review,
  UnitPriceSpecification,
  WithContext
} from 'schema-dts'
import { SITE_URL } from '@/constants'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'

type Props = {
  handle: string
}

type ProductJsonLdShape = WithContext<ProductSchema | ProductGroup> & {
  aggregateRating?: AggregateRating
  review?: Review[]
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`

const mapAvailability = (availableForSale: boolean) =>
  availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

const sanitizeText = (value?: string | null) => {
  if (!value) return ''
  return value.replace(/\s+/g, ' ').trim()
}

const getShippingDetails = (): OfferShippingDetails => {
  return {
    '@type': 'OfferShippingDetails',
    'shippingRate': {
      '@type': 'MonetaryAmount',
      'value': 0,
      'currency': 'NOK'
    },
    'shippingDestination': {
      '@type': 'DefinedRegion',
      'addressCountry': 'NO'
    },
    'deliveryTime': {
      '@type': 'ShippingDeliveryTime',
      'handlingTime': {
        '@type': 'QuantitativeValue',
        'minValue': 0,
        'maxValue': 1,
        'unitCode': 'DAY'
      },
      'transitTime': {
        '@type': 'QuantitativeValue',
        'minValue': 1,
        'maxValue': 4,
        'unitCode': 'DAY'
      }
    }
  }
}

const getReviewMarkup = (handle: string): Pick<ProductJsonLdShape, 'aggregateRating' | 'review'> => {
  const bundle = productReviewBundles[handle]
  if (!bundle) return {}

  const aggregateRating: AggregateRating = {
    '@type': 'AggregateRating',
    'ratingValue': bundle.aggregateRating.ratingValue,
    'reviewCount': bundle.aggregateRating.reviewCount,
    'ratingCount': bundle.aggregateRating.ratingCount,
    'bestRating': bundle.aggregateRating.bestRating,
    'worstRating': bundle.aggregateRating.worstRating
  }

  const review: Review[] = bundle.reviews
    .filter(item => sanitizeText(item.reviewBody).length > 0)
    .map(item => ({
      '@type': 'Review',
      'author': {
        '@type': 'Person',
        'name': sanitizeText(item.author) || 'Verifisert kunde'
      },
      'publisher': {
        '@id': ORGANIZATION_ID,
        'sameAs': [
          'https://www.facebook.com/utekosen',
          'https://www.instagram.com/utekos.no',
          'https://www.wikidata.org/wiki/Q138904544'
        ]
      },
      'datePublished': item.datePublished,
      'reviewBody': sanitizeText(item.reviewBody),
      'reviewRating': {
        '@type': 'Rating',
        'ratingValue': item.ratingValue,
        'bestRating': 5,
        'worstRating': 4
      }
    }))

  if (review.length === 0) {
    return { aggregateRating }
  }

  return { aggregateRating, review }
}

const serializeJsonLd = (jsonLd: ProductJsonLdShape) => JSON.stringify(jsonLd).replace(/</g, '\\u003c')

export async function ProductJsonLd({ handle }: Props) {
  'use cache'

  cacheLife('max')
  cacheTag(`product-${handle}`, 'products')

  const rawProduct = await getProduct(handle)
  if (!rawProduct) return null

  const product = reshapeProductWithMetafields(rawProduct) || rawProduct

  const priceValidUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString()
    .slice(0, 10)

  const productUrl = `${SITE_URL}/produkter/${product.handle}`
  const variants = product.variants.edges
  const isProductGroup = variants.length > 0

  const defaultImages = computeVariantImages(product, null)
  const featuredImageRaw =
    defaultImages[0]?.url || product.featuredImage?.url
  const featuredImage =
    featuredImageRaw ? resolveImageSrc(featuredImageRaw) : undefined

  const merchantReturnPolicy: MerchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    'applicableCountry': 'NO',
    'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
    'merchantReturnDays': 14,
    'returnMethod': 'https://schema.org/ReturnByMail',
    'returnFees': 'https://schema.org/FreeReturn',
    'refundType': 'https://schema.org/FullRefund',
    'url': `${SITE_URL}/frakt-og-retur`
  }

  const brandName = sanitizeText(product.vendor) || 'Utekos®'
  const mainDescription =
    sanitizeText(getProductPageDescriptionText(product.handle))
    || sanitizeText(product.description)
    || product.title
  const reviewMarkup = getReviewMarkup(product.handle)

  const commonData = {
    name: product.title,
    brand: {
      '@type': 'Brand',
      'name': brandName
    },
    description: mainDescription,
    ...(featuredImage ? { image: featuredImage } : {})
  } as const

  const sellerReference = {
    '@id': ORGANIZATION_ID
  } as const

  let jsonLd: ProductJsonLdShape
  const cleanGroupId = cleanShopifyId(product.id)

  if (isProductGroup) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProductGroup',
      '@id': `${productUrl}#product-group`,
      ...commonData,
      ...reviewMarkup,
      ...(cleanGroupId ? { productGroupID: cleanGroupId } : {}),
      'url': productUrl,
      'hasVariant': variants.map(({ node: variant }): ProductSchema => {
        const variantImages = computeVariantImages(product, variant)
        const variantImageRaw = variantImages[0]?.url || featuredImage
        const variantImage =
          variantImageRaw ? resolveImageSrc(variantImageRaw) : undefined
        const variantPrice = variant.price?.amount ? String(variant.price.amount) : null
        const cleanVariantId = cleanShopifyId(variant.id)
        const originalPrice = variant.compareAtPrice?.amount ? String(variant.compareAtPrice.amount) : null
        const gtinData = getSchemaOrgGtinData(variant.barcode)

        const variantDescription =
          variant.title && variant.title !== 'Default Title' ?
            `${product.title} - ${variant.title}`
          : mainDescription

        const shippingDetails = getShippingDetails()

        const priceSpec: UnitPriceSpecification | undefined =
          originalPrice ?
            {
              '@type': 'UnitPriceSpecification',
              'priceType': 'https://schema.org/ListPrice',
              'price': originalPrice,
              'priceCurrency': variant.price?.currencyCode || 'NOK'
            }
          : undefined

        const offer: Offer = {
          '@type': 'Offer',
          'url': `${productUrl}?variant=${encodeURIComponent(variant.id)}`,
          'priceCurrency': variant.price?.currencyCode || 'NOK',
          'availability': mapAvailability(variant.availableForSale),
          priceValidUntil,
          'seller': sellerReference,
          'itemCondition': 'https://schema.org/NewCondition',
          'hasMerchantReturnPolicy': merchantReturnPolicy,
          shippingDetails,
          ...(variantPrice ? { price: variantPrice } : {}),
          ...(priceSpec ? { priceSpecification: priceSpec } : {})
        }

        return {
          '@type': 'Product',
          '@id': `${productUrl}#variant-${cleanVariantId || encodeURIComponent(variant.id)}`,
          ...(cleanVariantId ? { productID: cleanVariantId } : {}),
          'name':
            variant.title && variant.title !== 'Default Title' ?
              `${product.title} - ${variant.title}`
            : product.title,
          'brand': commonData.brand,
          'description': variantDescription,
          ...gtinData,
          ...(variant.sku ? { sku: variant.sku } : {}),
          ...(variantImage ? { image: variantImage } : {}),
          'offers': offer
        }
      })
    }
  } else {
    const firstVariant = variants[0]?.node
    const variantPrice = firstVariant?.price?.amount ? String(firstVariant.price.amount) : null
    const cleanVariantId = firstVariant?.id ? cleanShopifyId(firstVariant.id) : undefined
    const originalPrice =
      firstVariant?.compareAtPrice?.amount ? String(firstVariant.compareAtPrice.amount) : null
    const gtinData = getSchemaOrgGtinData(firstVariant?.barcode)

    const shippingDetails = getShippingDetails()

    const priceSpec: UnitPriceSpecification | undefined =
      originalPrice ?
        {
          '@type': 'UnitPriceSpecification',
          'priceType': 'https://schema.org/ListPrice',
          'price': originalPrice,
          'priceCurrency': firstVariant?.price?.currencyCode || 'NOK'
        }
      : undefined

    const offer: Offer = {
      '@type': 'Offer',
      'url': productUrl,
      'priceCurrency': firstVariant?.price?.currencyCode || 'NOK',
      'availability': mapAvailability(product.availableForSale),
      priceValidUntil,
      'seller': sellerReference,
      'itemCondition': 'https://schema.org/NewCondition',
      'hasMerchantReturnPolicy': merchantReturnPolicy,
      shippingDetails,
      ...(variantPrice ? { price: variantPrice } : {}),
      ...(priceSpec ? { priceSpecification: priceSpec } : {})
    }

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      ...commonData,
      ...reviewMarkup,
      ...gtinData,
      ...(cleanVariantId ? { productID: cleanVariantId } : {}),
      ...(firstVariant?.sku ? { sku: firstVariant.sku } : {}),
      'url': productUrl,
      'offers': offer
    }
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(jsonLd)
      }}
    />
  )
}
