import { resolveMetaCatalogProductId } from '@/lib/analytics/metaCatalogIdentity'
import type {
  CatalogSyncProduct,
  CatalogSyncVariant
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { getCatalogProductMetadata } from '@/lib/merchant-feeds/catalogProductMetadata'
import type { CatalogVariantPresentationResult } from '@/lib/products/presentation/resolveCatalogVariantPresentation'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'
import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

import { buildMetaCatalogTitle } from './buildMetaCatalogTitle'
import { getMetaCatalogMedia } from './getMetaCatalogMedia'
import type {
  MetaCatalogOffer,
  MetaCatalogOfferDisposition
} from './metaCatalogOffer'

const META_CURRENCY = 'NOK'
const META_FREE_SHIPPING_THRESHOLD = 999
const META_MAX_PRICE = 10_000_000
const META_STANDARD_SHIPPING_PRICE = 99

function normalizeText(value: string, maxLength: number) {
  return Array.from(
    value
      .replace(/\u0000/g, '')
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
    .slice(0, maxLength)
    .join('')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatMoney(value: string, offerId: string) {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) {
    throw new Error(
      `Meta catalog offer ${offerId} has invalid price "${value}"`
    )
  }

  const amount = Number(value)
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > META_MAX_PRICE
  ) {
    throw new Error(
      `Meta catalog offer ${offerId} has invalid price "${value}"`
    )
  }

  return `${amount.toFixed(2)} ${META_CURRENCY}`
}

function buildPrices(variant: CatalogSyncVariant, offerId: string) {
  const currentPrice = Number(variant.price)
  const compareAtPrice = Number(variant.compareAtPrice)
  const isSale =
    variant.compareAtPrice !== null &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > currentPrice

  return {
    price:
      isSale ?
        formatMoney(variant.compareAtPrice as string, offerId)
      : formatMoney(variant.price, offerId),
    salePrice:
      isSale ? formatMoney(variant.price, offerId) : null,
    priceState: isSale ? 'sale' : 'full_price',
    currentAmount: currentPrice
  }
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

  return gender as MetaCatalogOffer['gender']
}

export function buildMetaCatalogOffer(input: {
  disposition: Extract<MetaCatalogOfferDisposition, 'published'>
  orderingIndex: number
  product: CatalogSyncProduct
  publicVariant: Extract<
    CatalogVariantPresentationResult,
    { status: 'included' }
  >
  variant: CatalogSyncVariant
}): MetaCatalogOffer {
  const { disposition, orderingIndex, product, publicVariant, variant } =
    input
  const id = resolveMetaCatalogProductId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)?.trim()

  if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
    throw new Error(
      `Meta catalog offer ${id} is missing a numeric Shopify product ID`
    )
  }

  const gtin = normalizeGtin(variant.barcode)
  if (!gtin || !isValidGtin(gtin)) {
    throw new Error(`Meta catalog offer ${id} is missing a valid GTIN`)
  }

  const mpn = variant.sku?.trim() ?? ''
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,99}$/.test(mpn)) {
    throw new Error(`Meta catalog offer ${id} is missing a valid MPN`)
  }

  if (!variant.weight || variant.weight <= 0) {
    throw new Error(
      `Meta catalog offer ${id} is missing a positive shipping weight`
    )
  }

  const color = normalizeText(publicVariant.options.color ?? '', 100)
  const size = normalizeText(publicVariant.options.size ?? '', 200)
  const metadata = getCatalogProductMetadata(product.handle)
  const prices = buildPrices(variant, id)
  const description = normalizeText(
    `${publicVariant.presentation.description} Farge: ${color}. Størrelse: ${size}. Materiale: ${metadata.material}.`,
    5000
  )
  const title = normalizeText(
    buildMetaCatalogTitle({
      color,
      displayName: publicVariant.presentation.displayName,
      size
    }),
    65
  )
  const link = new URL(publicVariant.publicUrl)

  if (link.hostname !== 'utekos.no') {
    throw new Error(
      `Meta catalog offer ${id} must link to the public Utekos storefront`
    )
  }

  if (product.handle === 'utekos-techdown') {
    link.pathname = '/skreddersy-varmen'
  }

  const media = getMetaCatalogMedia({
    color,
    productHandle: product.handle
  })

  if (!media.images[0]) {
    throw new Error(
      `Meta catalog offer ${id} is missing a primary image`
    )
  }
  const inventoryQuantity = Math.max(
    0,
    variant.inventoryQuantity ?? 0
  )
  const internalLabels = [
    'utekos',
    `family_${product.handle.replaceAll('-', '_')}`,
    `color_${slugifyVariantOption(color).replaceAll('-', '_')}`,
    'catalog_active',
    ...(product.handle === 'utekos-stapper' ?
      ['collection_minimum_four']
    : [])
  ]
  const updatedAtMs = Math.max(
    Date.parse(product.updatedAt),
    Date.parse(variant.updatedAt)
  )

  if (!Number.isFinite(updatedAtMs)) {
    throw new Error(
      `Meta catalog offer ${id} has an invalid Shopify updatedAt value`
    )
  }

  return {
    id,
    itemGroupId,
    title,
    description,
    richTextDescription: `<p>${escapeHtml(description)}</p>`,
    shortDescription: normalizeText(description, 500),
    availability: 'in stock',
    visibility: disposition,
    condition: 'new',
    price: prices.price,
    salePrice: prices.salePrice,
    link: link.toString(),
    images: media.images,
    videos: media.videos,
    brand: 'Utekos',
    googleProductCategory: metadata.googleProductCategory,
    facebookProductCategory: metadata.facebookProductCategory,
    productType: metadata.productType,
    gtin,
    mpn,
    color,
    size,
    gender: buildGender(publicVariant.options.gender, id),
    ageGroup: 'adult',
    material: metadata.material,
    shipping: {
      country: 'NO',
      price:
        prices.currentAmount >= META_FREE_SHIPPING_THRESHOLD ?
          `0.00 ${META_CURRENCY}`
        : `${META_STANDARD_SHIPPING_PRICE.toFixed(2)} ${META_CURRENCY}`,
      service: '1-4 days'
    },
    shippingWeightValue: variant.weight,
    shippingWeightUnit: variant.weightUnit,
    internalLabels,
    customLabels: [
      normalizeText(publicVariant.presentation.displayName, 100),
      normalizeText(color, 100),
      normalizeText(size, 100),
      prices.priceState,
      product.handle === 'utekos-stapper' ?
        'minimum_fourth_product'
      : 'core_assortment'
    ],
    inventoryQuantity,
    orderingIndex,
    updatedAtMs
  }
}
