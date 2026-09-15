import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { getCatalogProductMetadata } from '@/lib/merchant-feeds/catalogProductMetadata'
import { MERCHANT_FEED_SITE_URL } from '@/lib/merchant-feeds/merchantFeedSiteUrl'
import { returnPolicy } from '@/lib/policies/returnPolicy'
import { resolveCatalogVariantPresentation } from '@/lib/products/presentation'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

export const OPENAI_ADS_PRODUCT_FEED_COLUMNS = [
  'item_id',
  'group_id',
  'offer_id',
  'listing_has_variations',
  'variant_dict',
  'title',
  'description',
  'url',
  'brand',
  'image_url',
  'price',
  'sale_price',
  'availability',
  'gtin',
  'mpn',
  'condition',
  'product_type',
  'google_product_category',
  'color',
  'size',
  'material',
  'pattern',
  'age_group',
  'gender',
  'seller_name',
  'seller_url',
  'return_policy',
  'target_countries',
  'store_country',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'custom_label_3',
  'custom_label_4',
  'is_eligible_search',
  'is_eligible_checkout',
  'is_ads_eligible'
] as const

type Column = (typeof OPENAI_ADS_PRODUCT_FEED_COLUMNS)[number]
type Row = Record<Column, string>

const MAX_PRICE = 10_000_000
const VARIANT_OPTION_NAMES = new Set([
  'color',
  'farge',
  'gender',
  'kjønn',
  'pattern',
  'mønster',
  'size',
  'størrelse',
  'str'
])

function sanitize(value: string, maxLength: number) {
  return Array.from(
    value
      .replace(/\u0000/g, '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
    .slice(0, maxLength)
    .join('')
}

function csvCell(value: string) {
  if (!/[",\r\n]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' && !url.username && !url.password
    )
  } catch {
    return false
  }
}

function formatMoney(value: string, itemId: string) {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) {
    throw new Error(
      `OpenAI Ads item ${itemId} has invalid price "${value}"`
    )
  }

  const amount = Number(value)
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_PRICE
  ) {
    throw new Error(
      `OpenAI Ads item ${itemId} has out-of-range price "${value}"`
    )
  }

  return `${amount.toFixed(2)} NOK`
}

function buildPrices(
  variant: CatalogSyncVariant,
  itemId: string
) {
  const current = Number(variant.price)
  const comparison = Number(variant.compareAtPrice)
  const onSale =
    variant.compareAtPrice !== null &&
    Number.isFinite(current) &&
    Number.isFinite(comparison) &&
    comparison > current

  return onSale ?
      {
        price: formatMoney(
          variant.compareAtPrice as string,
          itemId
        ),
        salePrice: formatMoney(variant.price, itemId)
      }
    : {
        price: formatMoney(variant.price, itemId),
        salePrice: ''
      }
}

function buildGtin(barcode: string | null) {
  const gtin = normalizeGtin(barcode)
  return gtin && isValidGtin(gtin) ? gtin : ''
}

function buildMpn(sku: string | null) {
  const mpn = sku?.trim() ?? ''
  return (
      /^[A-Za-z0-9][A-Za-z0-9._-]{2,69}$/.test(mpn) &&
        /[A-Za-z]/.test(mpn)
    ) ?
      mpn
    : ''
}

function selectedOption(
  variant: CatalogSyncVariant,
  names: string[]
) {
  const accepted = new Set(names.map(name => name.toLowerCase()))
  return sanitize(
    variant.selectedOptions.find(option =>
      accepted.has(option.name.trim().toLowerCase())
    )?.value ?? '',
    100
  )
}

function buildGender(value: string | undefined, itemId: string) {
  const gender = value?.trim().toLowerCase() ?? ''
  const normalized = {
    dame: 'female',
    female: 'female',
    herre: 'male',
    kvinne: 'female',
    male: 'male',
    mann: 'male',
    unisex: 'unisex'
  }[gender]

  if (!normalized) {
    throw new Error(
      `OpenAI Ads item ${itemId} has unsupported gender "${gender}"`
    )
  }

  return normalized
}

function buildVariantDict(variant: CatalogSyncVariant) {
  return JSON.stringify(
    Object.fromEntries(
      variant.selectedOptions
        .filter(option =>
          VARIANT_OPTION_NAMES.has(
            option.name.trim().toLowerCase()
          )
        )
        .map(option => [
          sanitize(option.name, 50),
          sanitize(option.value, 100)
        ])
        .filter(([name, value]) => Boolean(name && value))
    )
  )
}

function buildTrackedUrl(publicUrl: string, itemId: string) {
  const url = new URL(publicUrl)
  url.searchParams.set('utm_source', 'openai')
  url.searchParams.set('utm_medium', 'paid_product')
  url.searchParams.set('utm_campaign', 'openai_ads_product_feed')
  url.searchParams.set('utm_content', itemId)
  return url.toString()
}

function buildRow(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): Row | null {
  const itemId = cleanShopifyId(variant.id)
  const groupId = cleanShopifyId(product.id)
  const presentation = resolveCatalogVariantPresentation({
    handle: product.handle,
    selectedOptions: variant.selectedOptions
  })

  if (presentation.status !== 'included') return null
  if (!itemId || !groupId || itemId === groupId) {
    throw new Error(
      'OpenAI Ads variant is missing stable, distinct identifiers'
    )
  }

  const imageUrl =
    variant.image?.url.trim() ||
    product.featuredImage?.url.trim() ||
    ''
  if (!isPublicHttpsUrl(imageUrl)) {
    throw new Error(
      `OpenAI Ads item ${itemId} is missing a public image URL`
    )
  }

  const metadata = getCatalogProductMetadata(product.handle)
  const prices = buildPrices(variant, itemId)
  const trackedUrl = buildTrackedUrl(
    presentation.publicUrl,
    itemId
  )
  if (!isPublicHttpsUrl(trackedUrl)) {
    throw new Error(
      `OpenAI Ads item ${itemId} is missing a public product URL`
    )
  }

  return {
    item_id: sanitize(itemId, 100),
    group_id: sanitize(groupId, 100),
    offer_id: sanitize(itemId, 100),
    listing_has_variations: 'true',
    variant_dict: buildVariantDict(variant),
    title: sanitize(presentation.publicName, 150),
    description: sanitize(
      presentation.presentation.description,
      5000
    ),
    url: trackedUrl,
    brand: 'Utekos',
    image_url: imageUrl,
    price: prices.price,
    sale_price: prices.salePrice,
    availability:
      variant.availableForSale ? 'in_stock' : 'out_of_stock',
    gtin: buildGtin(variant.barcode),
    mpn: buildMpn(variant.sku),
    condition: 'new',
    product_type: sanitize(metadata.productType, 750),
    google_product_category: metadata.googleProductCategory,
    color: sanitize(presentation.options.color ?? '', 100),
    size: sanitize(presentation.options.size ?? '', 100),
    material: sanitize(presentation.presentation.material, 200),
    pattern: selectedOption(variant, ['pattern', 'mønster']),
    age_group: 'adult',
    gender: buildGender(presentation.options.gender, itemId),
    seller_name: 'Utekos',
    seller_url: MERCHANT_FEED_SITE_URL,
    return_policy: returnPolicy.pageUrl,
    target_countries: 'NO',
    store_country: 'NO',
    custom_label_0: sanitize(
      variant.customLabel0?.value ?? '',
      100
    ),
    custom_label_1: sanitize(
      variant.customLabel1?.value ?? '',
      100
    ),
    custom_label_2: sanitize(
      variant.customLabel2?.value ?? '',
      100
    ),
    custom_label_3: sanitize(
      variant.customLabel3?.value ?? '',
      100
    ),
    custom_label_4: sanitize(
      variant.customLabel4?.value ?? '',
      100
    ),
    is_eligible_search: 'true',
    is_eligible_checkout: 'false',
    is_ads_eligible: 'true'
  }
}

export function buildOpenAiAdsProductFeed(
  products: CatalogSyncProduct[]
) {
  const rows = products
    .filter(product => product.status === 'ACTIVE')
    .flatMap(product =>
      product.variants.edges.map(({ node }) =>
        buildRow(product, node)
      )
    )
    .filter((row): row is Row => row !== null)
    .sort((left, right) =>
      left.item_id.localeCompare(right.item_id, 'en')
    )

  if (rows.length === 0) {
    throw new Error(
      'OpenAI Ads product feed contains no active offers'
    )
  }

  const lines = [
    OPENAI_ADS_PRODUCT_FEED_COLUMNS.join(','),
    ...rows.map(row =>
      OPENAI_ADS_PRODUCT_FEED_COLUMNS.map(column =>
        csvCell(row[column])
      ).join(',')
    )
  ]

  return `${lines.join('\r\n')}\r\n`
}
