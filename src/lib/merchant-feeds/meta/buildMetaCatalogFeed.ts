import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { resolveMetaCatalogProductId } from '@/lib/analytics/metaCatalogIdentity'
import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'
import { getCatalogProductMetadata } from '@/lib/merchant-feeds/catalogProductMetadata'
import { getPinterestCatalogImageUrls } from '@/lib/merchant-feeds/pinterest/getPinterestCatalogImageUrls'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

export const META_CATALOG_FEED_COLUMNS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'item_group_id',
  'google_product_category',
  'product_type',
  'gtin',
  'mpn',
  'color',
  'size',
  'gender',
  'age_group',
  'material',
  'sale_price',
  'additional_image_link',
  'status',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4'
] as const

type MetaCatalogFeedColumn =
  (typeof META_CATALOG_FEED_COLUMNS)[number]

type MetaCatalogFeedRow = Record<
  MetaCatalogFeedColumn,
  string
>

export type MetaCatalogFeedDocument = {
  tsv: string
  lastModified: string
  offerCount: number
}

const META_FEED_CURRENCY = 'NOK'
const META_MAX_PRICE = 10_000_000
const SUPPORTED_META_IMAGE_EXTENSION = /\.(?:jpe?g|png)$/i

const FALLBACK_IMAGE_PATH_BY_HANDLE: Record<string, string> = {
  comfyrobe:
    '/Utekos-TechDown-Maritime-Blue-Unisex/Comfyrobe-XL-Dark-Blue.png',
  'utekos-dun': '/schema-bilder/utekos-dun.png',
  'utekos-mikrofiber':
    '/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-Mikrofiber-Patriot-Blue-Unisex..png',
  'utekos-stapper':
    '/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-Stapper-Dark-Background.png',
  'utekos-techdown':
    '/Utekos-TechDown-Maritime-Blue-Unisex/Utekos-TechDown-Maritime-Blue-Unisex.png'
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

function encodeFeedUrl(value: string) {
  return value.replaceAll(',', '%2C')
}

function isSupportedMetaImageUrl(value: string) {
  try {
    const url = new URL(value)

    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      SUPPORTED_META_IMAGE_EXTENSION.test(url.pathname)
    )
  } catch {
    return false
  }
}

function buildFallbackImageUrl(productHandle: string) {
  const path = FALLBACK_IMAGE_PATH_BY_HANDLE[productHandle]

  if (!path) {
    throw new Error(
      `Meta catalog product ${productHandle} is missing a JPEG or PNG fallback image`
    )
  }

  return `${MERCHANT_FEED_SITE_URL}${path}`
}

function buildImageLinks(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
) {
  const primaryCandidate =
    variant.image?.url.trim() ||
    product.featuredImage?.url.trim() ||
    ''
  const imageLink =
    isSupportedMetaImageUrl(primaryCandidate) ?
      primaryCandidate
    : buildFallbackImageUrl(product.handle)
  const candidates = product.images
    .map(image => image.url.trim())
    .filter(isSupportedMetaImageUrl)

  if (product.handle !== 'utekos-dun') {
    candidates.push(
      ...getPinterestCatalogImageUrls(product.handle)
        .additionalImageLinks
    )
  }

  const seen = new Set([imageLink])
  const additional: string[] = []
  let length = 0

  for (const candidate of candidates) {
    if (!isSupportedMetaImageUrl(candidate) || seen.has(candidate)) {
      continue
    }

    const encoded = encodeFeedUrl(candidate)
    const nextLength = length + (additional.length > 0 ? 1 : 0) + encoded.length

    if (nextLength > 2000) {
      break
    }

    seen.add(candidate)
    additional.push(encoded)
    length = nextLength
  }

  return {
    imageLink: encodeFeedUrl(imageLink),
    additionalImageLink: additional.join(',')
  }
}

function formatMoney(value: string, offerId: string) {
  const normalizedValue = value.trim()

  if (!/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    throw new Error(
      `Meta catalog offer ${offerId} has invalid price "${value}"`
    )
  }

  const amount = Number(normalizedValue)

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > META_MAX_PRICE
  ) {
    throw new Error(
      `Meta catalog offer ${offerId} has out-of-range price "${value}"`
    )
  }

  return `${amount.toFixed(2)} ${META_FEED_CURRENCY}`
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
      priceState: 'full_price'
    }
  }

  return {
    price: formatMoney(variant.compareAtPrice as string, offerId),
    salePrice: formatMoney(variant.price, offerId),
    priceState: 'sale'
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

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,99}$/.test(normalizedSku)) {
    return ''
  }

  return normalizedSku
}

function buildGender(value: string | undefined, offerId: string) {
  const normalized = value?.trim().toLowerCase() ?? ''
  const gender = {
    dame: 'female',
    female: 'female',
    herre: 'male',
    kvinne: 'female',
    male: 'male',
    mann: 'male',
    unisex: 'unisex'
  }[normalized]

  if (!gender) {
    throw new Error(
      `Meta catalog offer ${offerId} has unsupported gender "${normalized}"`
    )
  }

  return gender
}

function buildTitle(input: {
  displayName: string
  color: string
  size: string
}) {
  return [input.displayName, input.color, input.size]
    .filter(Boolean)
    .join(' - ')
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
      `Meta catalog offer ${offerId} has an invalid Shopify updatedAt value`
    )
  }

  return latestUpdatedAt
}

function buildRow(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): { row: MetaCatalogFeedRow; updatedAtMs: number } {
  const offerId = resolveMetaCatalogProductId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)?.trim()
  const publicVariant = resolveCatalogVariantPresentation({
    handle: product.handle,
    selectedOptions: variant.selectedOptions
  })

  if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
    throw new Error(
      `Meta catalog offer ${offerId} is missing a numeric Shopify product ID`
    )
  }

  if (publicVariant.status !== 'included') {
    throw new Error(
      `Meta catalog offer ${offerId} has no publishable Utekos presentation`
    )
  }

  const color = sanitizeFeedValue(
    publicVariant.options.color ?? '',
    200
  )
  const size = sanitizeFeedValue(
    publicVariant.options.size ?? '',
    200
  )
  const metadata = getCatalogProductMetadata(product.handle)
  const prices = buildPrices(variant, offerId)
  const images = buildImageLinks(product, variant)

  return {
    updatedAtMs: buildOfferUpdatedAt(product, variant, offerId),
    row: {
      id: offerId,
      title: sanitizeFeedValue(
        buildTitle({
          displayName: publicVariant.presentation.displayName,
          color,
          size
        }),
        200
      ),
      description: sanitizeFeedValue(
        publicVariant.presentation.description,
        9999
      ),
      availability:
        variant.availableForSale ? 'in stock' : 'out of stock',
      condition: 'new',
      price: prices.price,
      link: publicVariant.publicUrl,
      image_link: images.imageLink,
      brand: 'Utekos',
      item_group_id: sanitizeFeedValue(itemGroupId, 100),
      google_product_category: metadata.googleProductCategory,
      product_type: sanitizeFeedValue(metadata.productType, 750),
      gtin: buildGtin(variant.barcode),
      mpn: buildMpn(variant.sku),
      color,
      size,
      gender: buildGender(publicVariant.options.gender, offerId),
      age_group: 'adult',
      material: sanitizeFeedValue(metadata.material, 200),
      sale_price: prices.salePrice,
      additional_image_link: images.additionalImageLink,
      status: 'active',
      custom_label_0: sanitizeFeedValue(
        variant.customLabel0?.value ??
          publicVariant.presentation.displayName,
        100
      ),
      custom_label_1: sanitizeFeedValue(
        variant.customLabel1?.value ?? prices.priceState,
        100
      ),
      custom_label_2: sanitizeFeedValue(
        variant.customLabel2?.value ?? product.handle,
        100
      ),
      custom_label_3: sanitizeFeedValue(
        variant.customLabel3?.value ?? '',
        100
      ),
      custom_label_4: sanitizeFeedValue(
        variant.customLabel4?.value ??
          (variant.inventoryQuantity === null ?
            ''
          : String(variant.inventoryQuantity)),
        100
      )
    }
  }
}

export function buildMetaCatalogFeedDocument(
  products: CatalogSyncProduct[]
): MetaCatalogFeedDocument {
  const offers = products
    .filter(product => product.status === 'ACTIVE')
    .flatMap(product =>
      product.variants.edges
        .map(({ node }) => node)
        .filter(
          variant =>
            resolveCatalogVariantPresentation({
              handle: product.handle,
              selectedOptions: variant.selectedOptions
            }).status === 'included'
        )
        .map(variant => buildRow(product, variant))
    )

  if (offers.length === 0) {
    throw new Error(
      'Meta catalog feed contains no active public offers'
    )
  }

  const lines = [
    META_CATALOG_FEED_COLUMNS.join('\t'),
    ...offers.map(({ row }) =>
      META_CATALOG_FEED_COLUMNS.map(
        column => row[column]
      ).join('\t')
    )
  ]

  return {
    tsv: `${lines.join('\r\n')}\r\n`,
    lastModified: new Date(
      Math.max(...offers.map(offer => offer.updatedAtMs))
    ).toUTCString(),
    offerCount: offers.length
  }
}

export function buildMetaCatalogFeed(
  products: CatalogSyncProduct[]
) {
  return buildMetaCatalogFeedDocument(products).tsv
}
