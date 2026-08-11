import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import { getMicrosoftMerchantProductCategory } from './getMicrosoftMerchantProductCategory'
import { isMicrosoftMerchantOfferIncluded } from './isMicrosoftMerchantOfferIncluded'

export const MICROSOFT_MERCHANT_FEED_COLUMNS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'additional_image_link',
  'availability',
  'price',
  'sale_price',
  'brand',
  'gtin',
  'mpn',
  'identifier_exists',
  'item_group_id',
  'product_type',
  'product_category',
  'color',
  'size',
  'age_group',
  'gender',
  'material',
  'pattern',
  'adult',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
  'condition'
] as const

type MicrosoftMerchantFeedColumn =
  (typeof MICROSOFT_MERCHANT_FEED_COLUMNS)[number]

type MicrosoftMerchantFeedRow = Record<
  MicrosoftMerchantFeedColumn,
  string
>

const MICROSOFT_FEED_CURRENCY = 'NOK'
const MICROSOFT_MAX_PRICE = 10_000_000

const VARIANT_ATTRIBUTE_NAMES = new Set([
  'age group',
  'age_group',
  'aldersgruppe',
  'color',
  'farge',
  'gender',
  'kjønn',
  'material',
  'materiale',
  'pattern',
  'mønster',
  'size',
  'størrelse',
  'str'
])

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

function buildMpn(sku: string | null) {
  const normalizedSku = sku?.trim() ?? ''

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,69}$/.test(normalizedSku)) {
    return ''
  }

  return /[A-Za-z]/.test(normalizedSku) ? normalizedSku : ''
}

function buildGtin(barcode: string | null) {
  const normalizedGtin = normalizeGtin(barcode)

  return normalizedGtin && isValidGtin(normalizedGtin)
    ? normalizedGtin
    : ''
}

function formatMoney(value: string, offerId: string) {
  const normalizedValue = value.trim()

  if (!/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    throw new Error(
      `Microsoft Merchant offer ${offerId} has invalid price "${value}"`
    )
  }

  const amount = Number(normalizedValue)

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MICROSOFT_MAX_PRICE
  ) {
    throw new Error(
      `Microsoft Merchant offer ${offerId} has out-of-range price "${value}"`
    )
  }

  return `${amount.toFixed(2)} ${MICROSOFT_FEED_CURRENCY}`
}

function buildPrices(variant: CatalogSyncVariant, offerId: string) {
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
    price: formatMoney(variant.compareAtPrice as string, offerId),
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

function buildGender(value: string | undefined, offerId: string) {
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
      `Microsoft Merchant offer ${offerId} has missing or unsupported gender "${gender}"`
    )
  }

  return normalizedGender
}

function buildAdditionalImageLinks(
  product: CatalogSyncProduct,
  primaryImageLink: string
) {
  const productColors = new Set(
    product.variants.edges
      .map(({ node }) => getSelectedOption(node, ['color', 'farge']))
      .filter(Boolean)
      .map(color => color.toLowerCase())
  )

  if (productColors.size > 1) {
    return ''
  }

  const seenUrls = new Set([primaryImageLink])

  return product.images
    .map(image => image.url.trim())
    .filter(url => {
      if (!url || seenUrls.has(url)) {
        return false
      }

      seenUrls.add(url)
      return true
    })
    .slice(0, 10)
    .map(url => url.replaceAll(',', '%2C'))
    .join(',')
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function canUseItemGroupId(product: CatalogSyncProduct) {
  if (product.variants.edges.length < 2) {
    return false
  }

  return product.variants.edges.every(({ node }) =>
    node.selectedOptions.some(option =>
      VARIANT_ATTRIBUTE_NAMES.has(option.name.trim().toLowerCase())
    )
  )
}

function buildRow(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): MicrosoftMerchantFeedRow {
  const offerId = cleanShopifyId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)
  const publicVariant = resolveCatalogVariantPresentation({
    handle: product.handle,
    selectedOptions: variant.selectedOptions
  })
  const imageLink =
    variant.image?.url.trim() || product.featuredImage?.url.trim() || ''

  if (!offerId) {
    throw new Error('Microsoft Merchant offer is missing an ID')
  }

  if (publicVariant.status !== 'included') {
    throw new Error(
      `Microsoft Merchant offer ${offerId} has no publishable Utekos presentation`
    )
  }

  if (!isHttpUrl(imageLink)) {
    throw new Error(
      `Microsoft Merchant offer ${offerId} is missing a valid image URL`
    )
  }

  const brand = 'Utekos'
  const gtin = buildGtin(variant.barcode)
  const mpn = buildMpn(variant.sku)
  const prices = buildPrices(variant, offerId)
  const hasUniqueIdentifiers = Boolean(gtin || (brand && mpn))

  return {
    id: sanitizeFeedValue(offerId, 50),
    title: sanitizeFeedValue(publicVariant.publicName, 150),
    description: sanitizeFeedValue(
      publicVariant.presentation.description,
      10_000
    ),
    link: `${MERCHANT_FEED_SITE_URL}${publicVariant.publicPath}`,
    image_link: imageLink,
    additional_image_link: buildAdditionalImageLinks(product, imageLink),
    availability: variant.availableForSale ? 'in stock' : 'out of stock',
    price: prices.price,
    sale_price: prices.salePrice,
    brand,
    gtin,
    mpn,
    identifier_exists: hasUniqueIdentifiers ? 'TRUE' : 'FALSE',
    item_group_id:
      canUseItemGroupId(product) && itemGroupId
        ? sanitizeFeedValue(itemGroupId, 50)
        : '',
    product_type: sanitizeFeedValue(
      publicVariant.presentation.category,
      750
    ),
    product_category: getMicrosoftMerchantProductCategory(product.handle),
    color: sanitizeFeedValue(publicVariant.options.color ?? '', 100),
    size: sanitizeFeedValue(publicVariant.options.size ?? '', 100),
    age_group: 'adult',
    gender: buildGender(publicVariant.options.gender, offerId),
    material: sanitizeFeedValue(
      publicVariant.presentation.material,
      200
    ),
    pattern: getSelectedOption(variant, ['pattern', 'mønster']),
    adult: 'FALSE',
    custom_label_0: sanitizeFeedValue(
      variant.customLabel0?.value ?? '',
      100
    ),
    custom_label_1: sanitizeFeedValue(
      variant.customLabel1?.value ?? '',
      100
    ),
    custom_label_2: sanitizeFeedValue(
      variant.customLabel2?.value ?? '',
      100
    ),
    custom_label_3: sanitizeFeedValue(
      variant.customLabel3?.value ?? '',
      100
    ),
    custom_label_4: sanitizeFeedValue(
      variant.customLabel4?.value ?? '',
      100
    ),
    condition: 'new'
  }
}

export function buildMicrosoftMerchantFeed(
  products: CatalogSyncProduct[]
): string {
  const rows = products
    .filter(product => product.status === 'ACTIVE')
    .flatMap(product =>
      product.variants.edges
        .map(({ node }) => node)
        .filter(variant =>
          isMicrosoftMerchantOfferIncluded(product, variant)
        )
        .map(variant => buildRow(product, variant))
    )

  if (rows.length === 0) {
    throw new Error('Microsoft Merchant feed contains no active offers')
  }

  const lines = [
    MICROSOFT_MERCHANT_FEED_COLUMNS.join('\t'),
    ...rows.map(row =>
      MICROSOFT_MERCHANT_FEED_COLUMNS.map(column => row[column]).join('\t')
    )
  ]

  return `${lines.join('\r\n')}\r\n`
}
