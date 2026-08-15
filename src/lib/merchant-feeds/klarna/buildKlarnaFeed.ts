import { FREE_SHIPPING_THRESHOLD } from '@/constants/free-shipping-threshold'
import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import { getKlarnaFeedCategory } from './getKlarnaFeedCategory'

export const KLARNA_FEED_CURRENCY = 'NOK'
export const KLARNA_FEED_FREE_SHIPPING = '0 NOK'
export const KLARNA_FEED_PAID_SHIPPING = '99 NOK'
export const KLARNA_FEED_DELIVERY_TIME = '2-5 virkedager'
export const KLARNA_FEED_SIZE_SYSTEM = 'NO'

const KLARNA_MAX_PRICE = 10_000_000
const KLARNA_IMAGES_PER_OFFER = 4
const KLARNA_EXCLUDED_PRODUCT_HANDLES = new Set([
  'utekos-stapper'
])

type KlarnaImageUrls = readonly [string, string, string, string]

type KlarnaFeedOffer = {
  sku: string
  name: string
  price: string
  salePrice: string
  shipping: string
  stockStatus: string
  deliveryTime: string
  brand: string
  manufacturer: string
  ean: string
  condition: string
  mpn: string
  url: string
  imageUrls: KlarnaImageUrls
  category: string
  description: string
  color: string
  size: string
  gender: string
  material: string
  groupId: string
  sizeSystem: string
  adultContent: string
  updatedAt: string
}

export type KlarnaFeedDocument = {
  xml: string
  lastModified: string
}

function truncateUnicode(value: string, maxLength: number) {
  return Array.from(value).slice(0, maxLength).join('')
}

function sanitizeFeedValue(value: string, maxLength: number) {
  const sanitizedValue = value
    .replace(/\u0000/g, '')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return truncateUnicode(sanitizedValue, maxLength)
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, '\u0027')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildProductTitle(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
) {
  const optionSummary = variant.selectedOptions
    .map(option => option.value.trim())
    .filter(
      value => value && value.toLowerCase() !== 'default title'
    )
    .join(', ')
  const title =
    optionSummary ?
      `${product.title}, ${optionSummary}`
    : product.title

  return sanitizeFeedValue(title, 150)
}

function buildProductDescription(product: CatalogSyncProduct) {
  const description = sanitizeFeedValue(
    stripHtml(product.descriptionHtml),
    10_000
  )

  return description || sanitizeFeedValue(product.title, 10_000)
}

function buildManufacturer(product: CatalogSyncProduct) {
  const vendor = sanitizeFeedValue(product.vendor ?? '', 70)

  if (vendor) {
    return vendor
  }

  const isUtekosProduct = [product.title, product.handle].some(
    value => /^utekos\b/i.test(value.trim())
  )

  return isUtekosProduct ? 'Utekos' : ''
}

function buildMpn(sku: string | null) {
  const normalizedSku = sku?.trim() ?? ''

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,69}$/.test(normalizedSku)) {
    return ''
  }

  return normalizedSku
}

function buildGtin(barcode: string | null) {
  const normalizedGtin = normalizeGtin(barcode)

  return normalizedGtin && isValidGtin(normalizedGtin) ?
      normalizedGtin
    : ''
}

function formatMoney(value: string, offerId: string) {
  const normalizedValue = value.trim()

  if (!/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    throw new Error(
      `Klarna feed offer ${offerId} has invalid price "${value}"`
    )
  }

  const amount = Number(normalizedValue)

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > KLARNA_MAX_PRICE
  ) {
    throw new Error(
      `Klarna feed offer ${offerId} has out-of-range price "${value}"`
    )
  }

  return `${amount.toFixed(2)} ${KLARNA_FEED_CURRENCY}`
}

function buildPrices(
  variant: CatalogSyncVariant,
  offerId: string
) {
  const currentPrice = Number(variant.price)
  const compareAtPrice = Number(variant.compareAtPrice)
  const hasSalePrice =
    variant.compareAtPrice !== null &&
    Number.isFinite(currentPrice) &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > currentPrice

  if (!hasSalePrice) {
    return {
      price: formatMoney(variant.price, offerId),
      salePrice: ''
    }
  }

  return {
    price: formatMoney(
      variant.compareAtPrice as string,
      offerId
    ),
    salePrice: formatMoney(variant.price, offerId)
  }
}

function getSelectedOption(
  variant: CatalogSyncVariant,
  optionNames: string[]
) {
  const normalizedNames = new Set(
    optionNames.map(name => name.toLowerCase())
  )
  const option = variant.selectedOptions.find(selectedOption =>
    normalizedNames.has(selectedOption.name.trim().toLowerCase())
  )

  return sanitizeFeedValue(option?.value ?? '', 100)
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function buildKlarnaProductUrl(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
) {
  const url = new URL(
    `/produkter/${encodeURIComponent(product.handle)}`,
    MERCHANT_FEED_SITE_URL
  )

  url.searchParams.set('variant', variant.id)
  url.searchParams.set('utm_source', 'klarna')
  url.searchParams.set('utm_medium', 'shopping')
  url.searchParams.set('utm_campaign', 'klarna_search_compare')
  url.searchParams.set(
    'utm_content',
    variant.sku ?? cleanShopifyId(variant.id) ?? variant.id
  )

  return url.toString()
}

function buildStableImageUrl(value: string) {
  const url = new URL(value)

  if (url.hostname === 'cdn.shopify.com') {
    url.searchParams.delete('v')
  }

  return url.toString()
}

const KLARNA_STATIC_IMAGE_PATH_BY_SKU: Readonly<
  Record<string, string>
> = {
  'COMFYROBE-FJELLNATT-S': '/Comfyrobe-Fjellnatt-XS-Unisex.jpg',
  'COMFYROBE-FJELLNATT-L': '/Comfyrobe-Fjellnatt-XL-Unisex.jpg',
  'TECHDOWN-HAVDYP-M':
    '/Utekos-TechDown-Maritime-Blue-Medium-Unisex.jpg',
  'TECHDOWN-HAVDYP-XL':
    '/Utekos-TechDown-Maritime-Blue-XL-Unisex.jpg'
}

const KLARNA_STATIC_IMAGE_PATHS_BY_HANDLE: Readonly<
  Record<string, readonly [string, string, string, string]>
> = {
  'comfyrobe': [
    '/Comfyrobe-Fjellnatt-Back-View.jpg',
    '/Comfyrobe-Fjellnatt-XS-Unisex.jpg',
    '/Comfyrobe-Fjellnatt-XL-Unisex.jpg',
    '/Comfyrobe-Night-Blue-XL-Unisex.jpg'
  ],
  'utekos-mikrofiber': [
    '/Utekos-Mikrofiber-Patriot-Blue-Unisex-Parkas-Mode.jpg',
    '/Utekos-Mikrofiber-Patriot-Blue-Unisex-Folded-Front.jpg',
    '/Utekos-Mikrofiber-Patriot-Blue-Backside.jpg',
    '/Utekos-Mikrofiber-Patriot-Blue-Women-In-Woods.jpg'
  ],
  'utekos-techdown': [
    '/Utekos-TechDown-Maritime-Blue-Unisex-Full-Mode.jpg',
    '/Utekos-TechDown-Maritime-Blue-Medium-Unisex.jpg',
    '/Utekos-TechDown-Maritime-Blue-XL-Unisex.jpg',
    '/Utekos-TechDown-Maritime-Blue-Unisex-Folded-Back-View.jpg'
  ]
}

function requireFourUniqueImageUrls(
  sourceUrls: string[],
  offerId: string
): KlarnaImageUrls {
  const imageUrls = [...new Set(sourceUrls)].slice(
    0,
    KLARNA_IMAGES_PER_OFFER
  )

  if (imageUrls.length !== KLARNA_IMAGES_PER_OFFER) {
    throw new Error(
      `Klarna feed offer ${offerId} requires ${KLARNA_IMAGES_PER_OFFER} unique image URLs, found ${imageUrls.length}`
    )
  }

  return [
    imageUrls[0]!,
    imageUrls[1]!,
    imageUrls[2]!,
    imageUrls[3]!
  ]
}

function buildKlarnaImageUrls(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant,
  offerId: string
): KlarnaImageUrls {
  const sku = variant.sku?.trim().toUpperCase() ?? ''
  const staticImagePaths =
    KLARNA_STATIC_IMAGE_PATHS_BY_HANDLE[product.handle]

  if (staticImagePaths) {
    const primaryImagePath = KLARNA_STATIC_IMAGE_PATH_BY_SKU[sku]
    const orderedPaths = [
      ...(primaryImagePath ? [primaryImagePath] : []),
      ...staticImagePaths.filter(
        path => path !== primaryImagePath
      )
    ]

    return requireFourUniqueImageUrls(
      orderedPaths.map(path =>
        new URL(path, MERCHANT_FEED_SITE_URL).toString()
      ),
      offerId
    )
  }

  const sourceImageUrls = [
    variant.image?.url.trim(),
    product.featuredImage?.url.trim(),
    ...product.images.map(image => image.url.trim())
  ]
    .filter(
      (url): url is string =>
        typeof url === 'string' && isHttpUrl(url)
    )
    .map(buildStableImageUrl)
  return requireFourUniqueImageUrls(sourceImageUrls, offerId)
}

function buildShipping(
  variant: CatalogSyncVariant,
  offerId: string
) {
  const price = Number(variant.price)

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      `Klarna feed offer ${offerId} has invalid shipping basis "${variant.price}"`
    )
  }

  return price >= FREE_SHIPPING_THRESHOLD ?
      KLARNA_FEED_FREE_SHIPPING
    : KLARNA_FEED_PAID_SHIPPING
}

function buildOfferUpdatedAt(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant,
  offerId: string
) {
  const latestUpdatedAt = Math.max(
    Date.parse(product.updatedAt),
    Date.parse(variant.updatedAt)
  )

  if (!Number.isFinite(latestUpdatedAt)) {
    throw new Error(
      `Klarna feed offer ${offerId} has an invalid Shopify updatedAt value`
    )
  }

  return new Date(latestUpdatedAt).toISOString()
}

function buildSku(variant: CatalogSyncVariant, offerId: string) {
  const sku = sanitizeFeedValue(variant.sku?.trim() ?? '', 70)

  if (sku) {
    return sku
  }

  return sanitizeFeedValue(offerId, 70)
}

function buildOffer(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): KlarnaFeedOffer {
  const offerId = cleanShopifyId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)

  if (!offerId) {
    throw new Error('Klarna feed offer is missing an ID')
  }

  const imageUrls = buildKlarnaImageUrls(
    product,
    variant,
    offerId
  )

  const manufacturer = buildManufacturer(product)
  const prices = buildPrices(variant, offerId)

  if (!manufacturer) {
    throw new Error(
      `Klarna feed offer ${offerId} is missing manufacturer/brand`
    )
  }

  return {
    sku: buildSku(variant, offerId),
    name: buildProductTitle(product, variant),
    price: prices.price,
    salePrice: prices.salePrice,
    shipping: buildShipping(variant, offerId),
    stockStatus: 'InStock',
    deliveryTime: KLARNA_FEED_DELIVERY_TIME,
    brand: manufacturer,
    manufacturer,
    ean: buildGtin(variant.barcode),
    condition: 'New',
    mpn: buildMpn(variant.sku),
    url: buildKlarnaProductUrl(product, variant),
    imageUrls,
    category: getKlarnaFeedCategory(product.handle),
    description: buildProductDescription(product),
    color: getSelectedOption(variant, ['color', 'farge']),
    size: getSelectedOption(variant, [
      'size',
      'størrelse',
      'str'
    ]),
    gender:
      getSelectedOption(variant, ['gender', 'kjønn']) ||
      'unisex',
    material: getSelectedOption(variant, [
      'material',
      'materiale'
    ]),
    groupId:
      itemGroupId ? sanitizeFeedValue(itemGroupId, 70) : '',
    sizeSystem: KLARNA_FEED_SIZE_SYSTEM,
    adultContent: 'no',
    updatedAt: buildOfferUpdatedAt(product, variant, offerId)
  }
}

function renderOfferXml(offer: KlarnaFeedOffer) {
  const fields: Array<[string, string]> = [
    ['sku', offer.sku],
    ['name', offer.name],
    ['price', offer.price],
    ['sale_price', offer.salePrice],
    ['shipping', offer.shipping],
    ['stock_status', offer.stockStatus],
    ['delivery_time', offer.deliveryTime],
    ['Brand', offer.brand],
    ['manufacturer', offer.manufacturer],
    ['ean', offer.ean],
    ['condition', offer.condition],
    ['mpn', offer.mpn],
    ['url', offer.url],
    ['image_url', offer.imageUrls[0]],
    ['additional_image_url_1', offer.imageUrls[1]],
    ['additional_image_url_2', offer.imageUrls[2]],
    ['additional_image_url_3', offer.imageUrls[3]],
    ['category', offer.category],
    ['description', offer.description],
    ['color', offer.color],
    ['size', offer.size],
    ['gender', offer.gender],
    ['material', offer.material],
    ['group_id', offer.groupId],
    ['size_system', offer.sizeSystem],
    ['adult_content', offer.adultContent]
  ]

  const body = fields
    .filter(([, value]) => value.length > 0)
    .map(
      ([name, value]) =>
        `    <${name}>${escapeXml(value)}</${name}>`
    )
    .join('\n')

  return `  <product>\n${body}\n  </product>`
}

export function buildKlarnaFeedDocument(
  products: CatalogSyncProduct[]
): KlarnaFeedDocument {
  const offers = products
    .filter(
      product =>
        product.status === 'ACTIVE' &&
        !KLARNA_EXCLUDED_PRODUCT_HANDLES.has(product.handle)
    )
    .flatMap(product =>
      product.variants.edges
        .map(({ node }) => node)
        .filter(
          variant =>
            variant.availableForSale &&
            Boolean(buildGtin(variant.barcode))
        )
        .map(variant => buildOffer(product, variant))
    )

  if (offers.length === 0) {
    throw new Error(
      'Klarna feed contains no purchasable offers with valid GTIN'
    )
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<products>',
    ...offers.map(renderOfferXml),
    '</products>',
    ''
  ].join('\n')

  const latestUpdatedAt = Math.max(
    ...offers.map(offer => Date.parse(offer.updatedAt))
  )

  return {
    xml,
    lastModified: new Date(latestUpdatedAt).toUTCString()
  }
}

export function buildKlarnaFeed(
  products: CatalogSyncProduct[]
): string {
  return buildKlarnaFeedDocument(products).xml
}
