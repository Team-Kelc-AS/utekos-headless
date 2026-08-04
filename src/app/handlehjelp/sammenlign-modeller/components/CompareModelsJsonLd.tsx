// Path: src/app/handlehjelp/sammenlign-modeller/components/CompareModelsJsonLd.tsx
import { productReviewBundles } from '@/db/data/reviews/productReviews'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { cacheLife } from 'next/cache'
import type { StaticImageData } from 'next/image'
import { SITE_URL } from '@/constants'
import type {
  AggregateOffer,
  AggregateRating,
  BreadcrumbList,
  FAQPage,
  Graph,
  ItemList,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Product as ProductSchema,
  ProductGroup,
  Review,
  UnitPriceSpecification,
  WebPage
} from 'schema-dts'
import { faqItems, modelRecommendations, type ModelRecommendation } from '../utils/comparisonData'

type ProductData = null
type ProductVariant = never
type ProductOffer = Offer | AggregateOffer

type ResolvedModel = {
  model: ModelRecommendation
  handle: string
  product: ProductData | null
}

type ReviewMarkup = {
  aggregateRating?: AggregateRating
  review?: Review[]
}

type ProductSchemaWithReviews = ProductSchema & ReviewMarkup

type FallbackPricing = {
  price: number
  originalPrice?: number
}

const PAGE_URL = `${SITE_URL}/handlehjelp/sammenlign-modeller`
const WEBSITE_ID = `${SITE_URL}/#website`
const ORGANIZATION_ID = `${SITE_URL}/#organization`
const PRODUCT_GROUP_ID = `${PAGE_URL}#product-group`
const ITEM_LIST_ID = `${PAGE_URL}#model-list`
const BREADCRUMB_ID = `${PAGE_URL}#breadcrumb`
const FAQ_ID = `${PAGE_URL}#faq`

const FALLBACK_PRICING: Record<ModelRecommendation['key'], FallbackPricing> = {
  'utekos-dun': {
    price: 2490,
    originalPrice: 3290
  },
  'utekos-mikrofiber': {
    price: 1590,
    originalPrice: 2290
  },
  'utekos-techdown': {
    price: 1790,
    originalPrice: 1990
  }
}

const sellerReference = {
  '@id': ORGANIZATION_ID
} as const

const absoluteUrl = (pathOrUrl: string | StaticImageData) => {
  const resolved = resolveImageSrc(pathOrUrl)

  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return resolved
  }

  return `${SITE_URL}${resolved.startsWith('/') ? '' : '/'}${resolved}`
}

const getHandleFromHref = (href: string) => {
  const segments = href.split('/').filter(Boolean)
  return segments[segments.length - 1] || href
}

const getProductUrl = (model: ModelRecommendation) => absoluteUrl(model.href)

const getModelProductId = (handle: string) => `${PAGE_URL}#product-${handle}`

const sanitizeText = (value?: string | null) => {
  if (!value) return ''
  return value.replace(/\s+/g, ' ').trim()
}

const formatPrice = (value: number) => value.toFixed(2)

const mapAvailability = (availableForSale: boolean): NonNullable<Offer['availability']> =>
  availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

const getVariants = (product: ProductData | null): ProductVariant[] =>
  []

const getVariantPrices = (product: ProductData | null) =>
  []

const getPriceCurrency = (product: ProductData | null) =>
  'NOK'

const getAvailability = (product: ProductData | null) => {
  return undefined
}

const getModelMaterial = (key: ModelRecommendation['key']) => {
  switch (key) {
    case 'utekos-dun':
      return 'Andedun'
    case 'utekos-mikrofiber':
      return 'Syntetisk mikrofiber'
    case 'utekos-techdown':
      return 'CloudWeave™ syntetisk isolasjon'
    default:
      return undefined
  }
}

const getShippingDetails = (): OfferShippingDetails => ({
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
      'maxValue': 5,
      'unitCode': 'DAY'
    }
  }
})

const getMerchantReturnPolicy = (): MerchantReturnPolicy => ({
  '@type': 'MerchantReturnPolicy',
  'applicableCountry': 'NO',
  'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
  'merchantReturnDays': 14,
  'returnMethod': 'https://schema.org/ReturnByMail',
  'returnFees': 'https://schema.org/FreeReturn',
  'refundType': 'https://schema.org/FullRefund',
  'url': `${SITE_URL}/frakt-og-retur`
})

const getPriceValidUntil = () =>
  new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10)

const getReviewMarkup = (handle: string): ReviewMarkup => {
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
        'worstRating': bundle.aggregateRating.worstRating
      }
    }))

  return review.length > 0 ? { aggregateRating, review } : { aggregateRating }
}

const buildProductOffer = (model: ModelRecommendation, product: ProductData | null): ProductOffer => {
  const productUrl = getProductUrl(model)
  const prices = getVariantPrices(product)
  const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b)
  const fallbackPricing = FALLBACK_PRICING[model.key]
  const currency = getPriceCurrency(product)
  const availability = getAvailability(product)
  const availabilityMarkup = typeof availability === 'boolean' ? mapAvailability(availability) : undefined
  const variants = getVariants(product)
  const effectivePrice = uniquePrices[0] ?? fallbackPricing.price
  const effectiveOriginalPrice = uniquePrices.length === 0 ? fallbackPricing.originalPrice : undefined
  const priceValidUntil = getPriceValidUntil()

  if (uniquePrices.length > 1) {
    const priceSpecification: UnitPriceSpecification | undefined =
      fallbackPricing.originalPrice ?
        {
          '@type': 'UnitPriceSpecification',
          'priceType': 'https://schema.org/ListPrice',
          'price': String(fallbackPricing.originalPrice),
          'priceCurrency': currency
        }
      : undefined

    const offer: AggregateOffer = {
      '@type': 'AggregateOffer',
      'url': productUrl,
      'priceCurrency': currency,
      'lowPrice': formatPrice(uniquePrices[0]!),
      'highPrice': formatPrice(uniquePrices[uniquePrices.length - 1]!),
      'offerCount': prices.length || variants.length || 1,
      'priceValidUntil': priceValidUntil,
      'seller': sellerReference,
      'itemCondition': 'https://schema.org/NewCondition',
      'hasMerchantReturnPolicy': getMerchantReturnPolicy(),
      'shippingDetails': getShippingDetails()
    }

    if (priceSpecification) {
      offer.priceSpecification = priceSpecification
    }

    if (availabilityMarkup) {
      offer.availability = availabilityMarkup
    }

    return offer
  }

  const offer: Offer = {
    '@type': 'Offer',
    'url': productUrl,
    'priceCurrency': currency,
    'price': formatPrice(effectivePrice),
    'priceValidUntil': priceValidUntil,
    'seller': sellerReference,
    'itemCondition': 'https://schema.org/NewCondition',
    'hasMerchantReturnPolicy': getMerchantReturnPolicy(),
    'shippingDetails': getShippingDetails()
  }

  if (effectiveOriginalPrice) {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      'priceType': 'https://schema.org/ListPrice',
      'price': String(effectiveOriginalPrice),
      'priceCurrency': currency
    }
  }

  if (availabilityMarkup) {
    offer.availability = availabilityMarkup
  }

  return offer
}

const buildProductGroupOffer = (resolvedModels: ResolvedModel[]): AggregateOffer | undefined => {
  const prices = resolvedModels.flatMap(({ product }) => getVariantPrices(product))
  const fallbackPrices = resolvedModels
    .map(({ model }) => FALLBACK_PRICING[model.key].price)
    .filter(price => Number.isFinite(price))
  const effectivePrices = prices.length > 0 ? prices : fallbackPrices
  if (effectivePrices.length === 0) return undefined

  const sortedPrices = [...effectivePrices].sort((a, b) => a - b)
  const firstProductWithCurrency =
    resolvedModels.find(({ product }) => getVariants(product).length > 0)?.product ?? null

  const anyAvailable = resolvedModels.some(({ product }) => getAvailability(product) === true)

  return {
    '@type': 'AggregateOffer',
    'url': PAGE_URL,
    'priceCurrency': getPriceCurrency(firstProductWithCurrency),
    'lowPrice': formatPrice(sortedPrices[0]!),
    'highPrice': formatPrice(sortedPrices[sortedPrices.length - 1]!),
    'offerCount': prices.length || fallbackPrices.length,
    'availability': mapAvailability(anyAvailable),
    'seller': sellerReference
  }
}

const buildModelProduct = ({ model, handle, product }: ResolvedModel): ProductSchemaWithReviews => {
  const productUrl = getProductUrl(model)
  const productName = model.name
  const productDescription = model.description
  const featuredImage = absoluteUrl(model.imageSrc)
  const material = getModelMaterial(model.key)

  return {
    '@type': 'Product',
    '@id': getModelProductId(handle),
    'name': productName,
    'alternateName': model.shortName,
    'description': productDescription,
    'image': featuredImage,
    'url': productUrl,
    'category': 'Utekos-modell',
    ...(material ? { material } : {}),
    'brand': {
      '@type': 'Brand',
      'name': 'Utekos'
    },
    'isVariantOf': {
      '@id': PRODUCT_GROUP_ID
    },
    'offers': buildProductOffer(model, product),
    'additionalProperty': [
      {
        '@type': 'PropertyValue',
        'name': 'Best for',
        'value': model.bestFor
      },
      {
        '@type': 'PropertyValue',
        'name': 'Anbefaling',
        'value': model.badge
      },
      ...model.proofPoints.map(point => ({
        '@type': 'PropertyValue' as const,
        'name': 'Egenskap',
        'value': point
      }))
    ],
    ...getReviewMarkup(handle)
  }
}

const resolveModelProduct = (model: ModelRecommendation): ResolvedModel => {
  const handle = getHandleFromHref(model.href)

  return {
    model,
    handle,
    product: null
  }
}

const serializeJsonLd = (jsonLd: Graph) => JSON.stringify(jsonLd).replace(/</g, '\\u003c')

export async function CompareModelsJsonLd() {
  'use cache'
  cacheLife('max')

  const resolvedModels: ResolvedModel[] = modelRecommendations.map(resolveModelProduct)

  const modelProducts = resolvedModels.map(buildModelProduct)
  const groupOffer = buildProductGroupOffer(resolvedModels)

  const productGroupNode: ProductGroup = {
    '@type': 'ProductGroup',
    '@id': PRODUCT_GROUP_ID,
    'name': 'Utekos-modeller',
    'description':
      'Sammenligning av Utekos Dun, Utekos Mikrofiber og Utekos TechDown for hytte, bobil, båt og norsk vær.',
    'url': PAGE_URL,
    'brand': {
      '@type': 'Brand',
      'name': 'Utekos',
      'slogan': 'Skreddersy varmen.'
    },
    'productGroupID': 'utekos-modeller',
    'variesBy': ['https://schema.org/material', 'https://schema.org/weight'],
    ...(groupOffer ? { offers: groupOffer } : {}),
    'hasVariant': modelProducts
  }

  const webPageNode: WebPage = {
    '@type': 'WebPage',
    '@id': `${PAGE_URL}#webpage`,
    'url': PAGE_URL,
    'name': 'Sammenlign Utekos-modeller',
    'description':
      'Kjøpsguide som sammenligner Utekos Dun, Utekos Mikrofiber og Utekos TechDown for hytte, bobil, båt og norsk vær.',
    'inLanguage': 'nb-NO',
    'isPartOf': {
      '@id': WEBSITE_ID
    },
    'breadcrumb': {
      '@id': BREADCRUMB_ID
    },
    'publisher': {
      '@id': ORGANIZATION_ID
    },
    'about': {
      '@id': PRODUCT_GROUP_ID
    },
    'mainEntity': {
      '@id': PRODUCT_GROUP_ID
    },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': `${SITE_URL}/og-image-compare.webp`,
      'width': '1200',
      'height': '630',
      'caption': 'Sammenligning av Utekos Dun, Utekos Mikrofiber og TechDown'
    }
  }

  const breadcrumbNode: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': BREADCRUMB_ID,
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Forsiden',
        'item': SITE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Sammenlign modeller'
      }
    ]
  }

  const itemListNode: ItemList = {
    '@type': 'ItemList',
    '@id': ITEM_LIST_ID,
    'name': 'Sammenlign Utekos-modeller',
    'description': 'Kuratert oversikt over Utekos Dun, Utekos Mikrofiber og Utekos TechDown.',
    'numberOfItems': resolvedModels.length,
    'itemListOrder': 'https://schema.org/ItemListOrderAscending',
    'itemListElement': resolvedModels.map(({ model, handle }, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': model.name,
      'url': getProductUrl(model),
      'item': {
        '@id': getModelProductId(handle)
      }
    }))
  }

  const faqNode: FAQPage = {
    '@type': 'FAQPage',
    '@id': FAQ_ID,
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [webPageNode, breadcrumbNode, productGroupNode, itemListNode, faqNode]
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
