import { FREE_SHIPPING_THRESHOLD } from '@/constants/free-shipping-threshold'
import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import {
  buildPublicVariantImageAlt,
  resolveCatalogVariantPresentation
} from '@/lib/products/presentation'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import { getPinterestCatalogImageUrls } from './getPinterestCatalogImageUrls'
import { getPinterestGoogleProductCategory } from './getPinterestGoogleProductCategory'
import { getPinterestMaterial } from './getPinterestMaterial'
import { getPinterestProductType } from './getPinterestProductType'
import { isPinterestCatalogOfferIncluded } from './isPinterestCatalogOfferIncluded'
import {
  PINTEREST_FEED_CURRENCY,
  PINTEREST_FEED_SIZE_SYSTEM
} from './pinterestCatalogRegistration'

export const PINTEREST_CATALOG_FEED_COLUMNS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'price',
  'availability',
  'item_group_id',
  'additional_image_link',
  'sale_price',
  'product_type',
  'brand',
  'gtin',
  'mpn',
  'condition',
  'google_product_category',
  'color',
  'gender',
  'age_group',
  'material',
  'pattern',
  'size',
  'size_system',
  'variant_names',
  'variant_values',
  'adult',
  'shipping',
  'free_shipping_label',
  'free_shipping_limit',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
  'ad_link',
  'alt_text'
] as const

type PinterestCatalogFeedColumn =
  (typeof PINTEREST_CATALOG_FEED_COLUMNS)[number]

type PinterestCatalogFeedRow = Record<
  PinterestCatalogFeedColumn,
  string
>

export type PinterestCatalogFeedDocument = {
  tsv: string
  lastModified: string
}

const PINTEREST_MAX_PRICE = 10_000_000
const PINTEREST_PAID_SHIPPING = '99.00 NOK'
const PINTEREST_FREE_SHIPPING = '0.00 NOK'

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

function buildMpn(sku: string | null) {
  const normalizedSku = sku?.trim() ?? ''

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,69}$/.test(normalizedSku)) {
    return ''
  }

  return /[A-Za-z]/.test(normalizedSku) ? normalizedSku : ''
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
      `Pinterest catalog offer ${offerId} has invalid price "${value}"`
    )
  }

  const amount = Number(normalizedValue)

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > PINTEREST_MAX_PRICE
  ) {
    throw new Error(
      `Pinterest catalog offer ${offerId} has out-of-range price "${value}"`
    )
  }

  return `${amount.toFixed(2)} ${PINTEREST_FEED_CURRENCY}`
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
      salePrice: '',
      isSale: false
    }
  }

  return {
    price: formatMoney(
      variant.compareAtPrice as string,
      offerId
    ),
    salePrice: formatMoney(variant.price, offerId),
    isSale: true
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

  return sanitizeFeedValue(option?.value ?? '', 30)
}

function buildGender(
  value: string | undefined,
  offerId: string
) {
  const gender = value?.trim().toLowerCase() ?? ''

  const normalizedGender = {
    dame: 'female',
    female: 'female',
    herre: 'male',
    kvinne: 'female',
    male: 'male',
    mann: 'male',
    unisex: 'unisex'
  }[gender]

  if (!normalizedGender) {
    throw new Error(
      `Pinterest catalog offer ${offerId} has missing or unsupported gender "${gender}"`
    )
  }

  return normalizedGender
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function buildAdLink(productLink: string, offerId: string) {
  const url = new URL(productLink)

  url.searchParams.set('utm_source', 'pinterest')
  url.searchParams.set('utm_medium', 'shopping')
  url.searchParams.set('utm_campaign', 'pinterest_catalog')
  url.searchParams.set('utm_content', offerId)

  const adLink = url.toString()

  if (adLink.length > 2000) {
    throw new Error(
      `Pinterest catalog offer ${offerId} has an ad_link longer than 2000 characters`
    )
  }

  return adLink
}

function buildShipping(
  variant: CatalogSyncVariant,
  offerId: string
) {
  const price = Number(variant.price)

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(
      `Pinterest catalog offer ${offerId} has invalid shipping basis "${variant.price}"`
    )
  }

  const hasFreeShipping = price >= FREE_SHIPPING_THRESHOLD

  return {
    shipping: `NO:::${hasFreeShipping ? PINTEREST_FREE_SHIPPING : PINTEREST_PAID_SHIPPING}`,
    freeShippingLabel: hasFreeShipping ? 'true' : 'false',
    freeShippingLimit:
      hasFreeShipping ? '0' : (
        `${FREE_SHIPPING_THRESHOLD.toFixed(2)} ${PINTEREST_FEED_CURRENCY}`
      )
  }
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
      `Pinterest catalog offer ${offerId} has an invalid Shopify updatedAt value`
    )
  }

  return latestUpdatedAt
}

function buildRow(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): { row: PinterestCatalogFeedRow; updatedAtMs: number } {
  const offerId = cleanShopifyId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)
  const publicVariant = resolveCatalogVariantPresentation({
    handle: product.handle,
    selectedOptions: variant.selectedOptions
  })
  const catalogImages = getPinterestCatalogImageUrls(
    product.handle
  )

  if (!offerId) {
    throw new Error('Pinterest catalog offer is missing an ID')
  }

  if (publicVariant.status !== 'included') {
    throw new Error(
      `Pinterest catalog offer ${offerId} has no publishable Utekos presentation`
    )
  }

  if (!isHttpUrl(catalogImages.imageLink)) {
    throw new Error(
      `Pinterest catalog offer ${offerId} is missing a valid image URL`
    )
  }

  if (publicVariant.publicUrl.length > 511) {
    throw new Error(
      `Pinterest catalog offer ${offerId} has a link longer than 511 characters`
    )
  }

  const prices = buildPrices(variant, offerId)
  const shipping = buildShipping(variant, offerId)
  const color = sanitizeFeedValue(
    publicVariant.options.color ?? '',
    30
  )
  const size = sanitizeFeedValue(
    publicVariant.options.size ?? '',
    30
  )
  const gender = buildGender(
    publicVariant.options.gender,
    offerId
  )

  return {
    updatedAtMs: buildOfferUpdatedAt(product, variant, offerId),
    row: {
      id: sanitizeFeedValue(offerId, 127),
      title: sanitizeFeedValue(publicVariant.publicName, 500),
      description: sanitizeFeedValue(
        publicVariant.presentation.description,
        10_000
      ),
      link: publicVariant.publicUrl,
      image_link: encodeFeedUrl(catalogImages.imageLink),
      price: prices.price,
      availability:
        variant.availableForSale ? 'in stock' : 'out of stock',
      item_group_id:
        itemGroupId ? sanitizeFeedValue(itemGroupId, 127) : '',
      additional_image_link: catalogImages.additionalImageLinks
        .map(encodeFeedUrl)
        .join(','),
      sale_price: prices.salePrice,
      product_type: getPinterestProductType(product.handle),
      brand: 'Utekos',
      gtin: buildGtin(variant.barcode),
      mpn: buildMpn(variant.sku),
      condition: 'new',
      google_product_category: getPinterestGoogleProductCategory(
        product.handle
      ),
      color,
      gender,
      age_group: 'adult',
      material: getPinterestMaterial(product.handle),
      pattern: getSelectedOption(variant, [
        'pattern',
        'mønster'
      ]),
      size,
      size_system: PINTEREST_FEED_SIZE_SYSTEM,
      variant_names: 'Color,Size,Gender',
      variant_values: [color, size, gender].join(','),
      adult: 'false',
      shipping: shipping.shipping,
      free_shipping_label: shipping.freeShippingLabel,
      free_shipping_limit: shipping.freeShippingLimit,
      custom_label_0: sanitizeFeedValue(
        variant.customLabel0?.value ??
          publicVariant.presentation.displayName,
        511
      ),
      custom_label_1: sanitizeFeedValue(
        variant.customLabel1?.value ??
          (prices.isSale ? 'sale' : 'full_price'),
        511
      ),
      custom_label_2: sanitizeFeedValue(
        variant.customLabel2?.value ?? product.handle,
        511
      ),
      custom_label_3: sanitizeFeedValue(
        variant.customLabel3?.value ?? '',
        511
      ),
      custom_label_4: sanitizeFeedValue(
        variant.customLabel4?.value ?? '',
        511
      ),
      ad_link: buildAdLink(publicVariant.publicUrl, offerId),
      alt_text: sanitizeFeedValue(
        buildPublicVariantImageAlt(
          publicVariant.presentation,
          publicVariant.options
        ),
        500
      )
    }
  }
}

export function buildPinterestCatalogFeedDocument(
  products: CatalogSyncProduct[]
): PinterestCatalogFeedDocument {
  const offers = products
    .filter(product => product.status === 'ACTIVE')
    .flatMap(product =>
      product.variants.edges
        .map(({ node }) => node)
        .filter(variant =>
          isPinterestCatalogOfferIncluded(product, variant)
        )
        .map(variant => buildRow(product, variant))
    )

  if (offers.length === 0) {
    throw new Error(
      'Pinterest catalog feed contains no active offers'
    )
  }

  const lines = [
    PINTEREST_CATALOG_FEED_COLUMNS.join('\t'),
    ...offers.map(({ row }) =>
      PINTEREST_CATALOG_FEED_COLUMNS.map(
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

export function buildPinterestCatalogFeed(
  products: CatalogSyncProduct[]
): string {
  return buildPinterestCatalogFeedDocument(products).tsv
}
