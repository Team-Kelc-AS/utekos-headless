import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import { getSnapchatCatalogProductMetadata } from './snapchatCatalogProductMetadata'

export const SNAPCHAT_CATALOG_FEED_COLUMNS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'availability',
  'price',
  'brand',
  'gtin',
  'mpn',
  'item_group_id',
  'google_product_category',
  'product_type',
  'condition',
  'age_group',
  'color',
  'gender',
  'material',
  'size',
  'size_system',
  'size_type',
  'adult',
  'sale_price',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4'
] as const

type SnapchatCatalogFeedColumn =
  (typeof SNAPCHAT_CATALOG_FEED_COLUMNS)[number]

type SnapchatCatalogFeedRow = Record<
  SnapchatCatalogFeedColumn,
  string
>

export type SnapchatCatalogFeedDocument = {
  tsv: string
  lastModified: string
}

const SNAPCHAT_FEED_CURRENCY = 'NOK'
const SNAPCHAT_MAX_PRICE = 10_000_000
const SUPPORTED_IMAGE_EXTENSION = /\.(?:jpe?g|png|webp)$/i

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

function formatMoney(value: string, offerId: string) {
  const normalizedValue = value.trim()

  if (!/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    throw new Error(
      `Snapchat catalog offer ${offerId} has invalid price "${value}"`
    )
  }

  const amount = Number(normalizedValue)

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > SNAPCHAT_MAX_PRICE
  ) {
    throw new Error(
      `Snapchat catalog offer ${offerId} has out-of-range price "${value}"`
    )
  }

  return `${amount.toFixed(2)} ${SNAPCHAT_FEED_CURRENCY}`
}

function buildPrices(
  variant: CatalogSyncVariant,
  offerId: string
) {
  const currentPrice = Number(variant.price)
  const compareAtPrice = Number(variant.compareAtPrice)
  const isSale =
    variant.compareAtPrice !== null &&
    Number.isFinite(currentPrice) &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > currentPrice

  if (!isSale) {
    return {
      price: formatMoney(variant.price, offerId),
      salePrice: '',
      isSale: false
    }
  }

  return {
    price: formatMoney(variant.compareAtPrice as string, offerId),
    salePrice: formatMoney(variant.price, offerId),
    isSale: true
  }
}

function buildGtin(barcode: string | null) {
  const normalizedGtin = normalizeGtin(barcode)

  return normalizedGtin && isValidGtin(normalizedGtin) ?
      normalizedGtin
    : ''
}

function buildMpn(sku: string | null) {
  const normalizedSku = sku?.trim() ?? ''
  return /^\d{1,50}$/.test(normalizedSku) ? normalizedSku : ''
}

function buildManualVariantTitle(input: {
  color: string
  displayName: string
  size: string
}) {
  const productAndColor = [input.displayName, input.color]
    .filter(Boolean)
    .join(' ')

  return input.size ?
      `${productAndColor} - ${input.size}`
    : productAndColor
}

function buildTrackedLink(publicUrl: string, offerId: string) {
  const url = new URL(publicUrl)

  url.searchParams.set('utm_source', 'snapchat')
  url.searchParams.set('utm_medium', 'paid_social')
  url.searchParams.set('utm_campaign', 'snapchat_catalog')
  url.searchParams.set('utm_content', offerId)

  const link = url.toString()

  if (link.length > 2000) {
    throw new Error(
      `Snapchat catalog offer ${offerId} has a link longer than 2000 characters`
    )
  }

  return link
}

function buildImageLink(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant,
  offerId: string
) {
  const sourceUrl =
    variant.image?.url ??
    product.featuredImage?.url ??
    product.images[0]?.url

  if (!sourceUrl) {
    throw new Error(
      `Snapchat catalog offer ${offerId} is missing an image`
    )
  }

  let url: URL

  try {
    url = new URL(sourceUrl)
  } catch {
    throw new Error(
      `Snapchat catalog offer ${offerId} has an invalid image URL`
    )
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    !SUPPORTED_IMAGE_EXTENSION.test(url.pathname)
  ) {
    throw new Error(
      `Snapchat catalog offer ${offerId} requires a WebP, JPEG or PNG image URL`
    )
  }

  const imageLink = url.toString().replaceAll(',', '%2C')

  if (imageLink.length > 2000) {
    throw new Error(
      `Snapchat catalog offer ${offerId} has an image URL longer than 2000 characters`
    )
  }

  return imageLink
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
      `Snapchat catalog offer ${offerId} has an invalid Shopify updatedAt value`
    )
  }

  return latestUpdatedAt
}

function buildRow(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): { row: SnapchatCatalogFeedRow; updatedAtMs: number } {
  const offerId = cleanShopifyId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)
  const publicVariant = resolveCatalogVariantPresentation({
    handle: product.handle,
    selectedOptions: variant.selectedOptions
  })

  if (!offerId || !itemGroupId) {
    throw new Error(
      'Snapchat catalog offer is missing a Shopify ID'
    )
  }

  if (publicVariant.status !== 'included') {
    throw new Error(
      `Snapchat catalog offer ${offerId} has no publishable Utekos presentation`
    )
  }

  const color = sanitizeFeedValue(
    publicVariant.options.color ?? '',
    100
  )
  const size = sanitizeFeedValue(
    publicVariant.options.size ?? '',
    100
  )
  const gender = sanitizeFeedValue(
    publicVariant.options.gender?.toLowerCase() ?? '',
    20
  )
  const metadata = getSnapchatCatalogProductMetadata(
    product.handle
  )
  const prices = buildPrices(variant, offerId)

  return {
    updatedAtMs: buildOfferUpdatedAt(product, variant, offerId),
    row: {
      id: sanitizeFeedValue(offerId, 128),
      title: sanitizeFeedValue(
        buildManualVariantTitle({
          displayName: publicVariant.presentation.displayName,
          color,
          size
        }),
        375
      ),
      description: sanitizeFeedValue(
        publicVariant.presentation.description,
        5000
      ),
      link: buildTrackedLink(publicVariant.publicUrl, offerId),
      image_link: buildImageLink(product, variant, offerId),
      availability: 'in stock',
      price: prices.price,
      brand: 'Utekos',
      gtin: buildGtin(variant.barcode),
      mpn: buildMpn(variant.sku),
      item_group_id: sanitizeFeedValue(itemGroupId, 128),
      google_product_category: metadata.googleProductCategory,
      product_type: sanitizeFeedValue(metadata.productType, 750),
      condition: 'new',
      age_group: 'adult',
      color,
      gender,
      material: sanitizeFeedValue(metadata.material, 200),
      size,
      size_system: 'EU',
      size_type: 'regular',
      adult: 'no',
      sale_price: prices.salePrice,
      custom_label_0: sanitizeFeedValue(
        publicVariant.presentation.displayName,
        100
      ),
      custom_label_1: prices.isSale ? 'sale' : 'full_price',
      custom_label_2: sanitizeFeedValue(product.handle, 100),
      custom_label_3: '',
      custom_label_4: ''
    }
  }
}

export function buildSnapchatCatalogFeedDocument(
  products: CatalogSyncProduct[]
): SnapchatCatalogFeedDocument {
  const offers = products
    .filter(product => product.status === 'ACTIVE')
    .flatMap(product =>
      product.variants.edges
        .map(({ node }) => node)
        .filter(variant => variant.availableForSale)
        .filter(variant =>
          resolveCatalogVariantPresentation({
            handle: product.handle,
            selectedOptions: variant.selectedOptions
          }).status === 'included'
        )
        .map(variant => buildRow(product, variant))
    )

  if (offers.length === 0) {
    throw new Error(
      'Snapchat catalog feed contains no active in-stock offers'
    )
  }

  const lines = [
    SNAPCHAT_CATALOG_FEED_COLUMNS.join('\t'),
    ...offers.map(({ row }) =>
      SNAPCHAT_CATALOG_FEED_COLUMNS.map(
        column => row[column]
      ).join('\t')
    )
  ]

  return {
    tsv: `${lines.join('\r\n')}\r\n`,
    lastModified: new Date(
      Math.max(...offers.map(offer => offer.updatedAtMs))
    ).toUTCString()
  }
}

export function buildSnapchatCatalogFeed(
  products: CatalogSyncProduct[]
) {
  return buildSnapchatCatalogFeedDocument(products).tsv
}
