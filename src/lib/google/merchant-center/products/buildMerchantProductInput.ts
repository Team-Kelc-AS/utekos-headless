import type {
  CatalogSyncProduct,
  CatalogSyncVariant,
  CatalogSyncWeightUnit
} from '@/lib/catalog-sync/types'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'
import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'

import { getMerchantCenterConfig } from '../config'
import type {
  MerchantProductIdentifierStrategy,
  MerchantProductInputBuildResult
} from '../merchantCenterTypes'

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, '\'')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildMerchantProductTitle(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
) {
  if (variant.title === 'Default Title') {
    return product.title.trim()
  }

  const optionSummary = variant.selectedOptions
    .map(option => option.value.trim())
    .filter(Boolean)
    .join(' / ')

  return optionSummary ?
      `${product.title.trim()} - ${optionSummary}`
    : `${product.title.trim()} - ${variant.title.trim()}`
}

function buildMerchantProductLink(
  handle: string,
  variantId: string
) {
  return `https://utekos.no/produkter/${handle}?variant=${encodeURIComponent(variantId)}`
}

function buildMerchantBrand(product: CatalogSyncProduct) {
  const vendor = product.vendor?.trim()

  if (vendor) {
    return vendor
  }

  const ownBrandSignals = [product.title, product.handle].some(
    signal => /^utekos\b/i.test(signal.trim())
  )

  return ownBrandSignals ? 'Utekos' : undefined
}

function shouldUseSkuAsMerchantMpn(
  sku: string | null | undefined
) {
  const normalizedSku = sku?.trim()

  if (!normalizedSku) {
    return false
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,69}$/.test(normalizedSku)) {
    return false
  }

  return /[A-Za-z]/.test(normalizedSku)
}

function buildMerchantAvailability(variant: CatalogSyncVariant) {
  if (variant.availableForSale) {
    return 'IN_STOCK'
  }

  if ((variant.inventoryQuantity ?? 0) > 0) {
    return 'IN_STOCK'
  }

  return 'OUT_OF_STOCK'
}

function convertMoneyStringToMicros(value: string) {
  const normalizedValue = value.trim()

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    throw new Error(`Invalid money value "${value}"`)
  }

  const [wholePart, fractionalPart = ''] =
    normalizedValue.split('.')
  const micros = `${wholePart}${fractionalPart.padEnd(6, '0').slice(0, 6)}`

  return micros.replace(/^0+(?=\d)/, '')
}

function buildMerchantPrice(
  value: string,
  currencyCode: string
) {
  return {
    amountMicros: convertMoneyStringToMicros(value),
    currencyCode
  }
}

function buildMerchantSalePrice(
  variant: CatalogSyncVariant,
  currencyCode: string
) {
  const compareAtPrice = variant.compareAtPrice?.trim()

  if (!compareAtPrice) {
    return null
  }

  const currentPrice = Number(variant.price)
  const originalPrice = Number(compareAtPrice)

  if (
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(originalPrice)
  ) {
    return null
  }

  if (originalPrice <= currentPrice) {
    return null
  }

  return {
    regularPrice: buildMerchantPrice(
      compareAtPrice,
      currencyCode
    ),
    salePrice: buildMerchantPrice(variant.price, currencyCode)
  }
}

function buildMerchantShippingWeight(
  weight: number | null,
  weightUnit: CatalogSyncWeightUnit
) {
  if (!weight || !Number.isFinite(weight) || weight <= 0) {
    return undefined
  }

  return { value: Number(weight.toFixed(4)), unit: weightUnit }
}

function getSelectedOptionValue(
  variant: CatalogSyncVariant,
  names: string[]
) {
  const normalizedNames = names.map(name => name.toLowerCase())
  const option = variant.selectedOptions.find(item =>
    normalizedNames.includes(item.name.trim().toLowerCase())
  )
  const value = option?.value.trim()

  return value ? value : undefined
}

function buildMerchantAdditionalImageLinks(
  product: CatalogSyncProduct,
  imageLink: string
) {
  const seenUrls = new Set([imageLink])
  const additionalImageLinks = product.images
    .map(image => image.url.trim())
    .filter(url => {
      if (!url || seenUrls.has(url)) {
        return false
      }

      seenUrls.add(url)
      return true
    })
    .slice(0, 10)

  return additionalImageLinks.length > 0 ?
      additionalImageLinks
    : undefined
}

export function buildMerchantProductInput(
  product: CatalogSyncProduct,
  variant: CatalogSyncVariant
): MerchantProductInputBuildResult {
  const config = getMerchantCenterConfig()
  const offerId = cleanShopifyId(variant.id)
  const itemGroupId = cleanShopifyId(product.id)
  const imageLink =
    variant.image?.url || product.featuredImage?.url

  if (!offerId) {
    return { ok: false, reason: 'missing_offer_id' }
  }

  if (!itemGroupId) {
    return { ok: false, reason: 'missing_item_group_id' }
  }

  if (!imageLink) {
    return { ok: false, reason: 'missing_image_link' }
  }

  if (!variant.price.trim()) {
    return { ok: false, reason: 'missing_price' }
  }

  const normalizedGtin = normalizeGtin(variant.barcode)
  const gtin =
    normalizedGtin && isValidGtin(normalizedGtin) ?
      normalizedGtin
    : undefined
  const mpn =
    !gtin && shouldUseSkuAsMerchantMpn(variant.sku) ?
      variant.sku?.trim()
    : undefined
  const brand = buildMerchantBrand(product)
  const salePrice = buildMerchantSalePrice(
    variant,
    config.defaults.currencyCode
  )
  const productLink = buildMerchantProductLink(
    product.handle,
    variant.id
  )
  const additionalImageLinks = buildMerchantAdditionalImageLinks(
    product,
    imageLink
  )
  const productType = product.productType?.trim()
  const color = getSelectedOptionValue(variant, [
    'color',
    'farge'
  ])
  const size = getSelectedOptionValue(variant, [
    'size',
    'størrelse'
  ])
  const productAttributes: Record<string, unknown> = {
    title: buildMerchantProductTitle(product, variant),
    description: stripHtml(product.descriptionHtml),
    link: productLink,
    canonicalLink: `https://utekos.no/produkter/${product.handle}`,
    imageLink,
    additionalImageLinks,
    availability: buildMerchantAvailability(variant),
    condition: 'NEW',
    googleProductCategory: '203',
    itemGroupId,
    productTypes: productType ? [productType] : undefined,
    color,
    size,
    customLabel0:
      variant.customLabel0?.value?.trim() || undefined,
    customLabel1:
      variant.customLabel1?.value?.trim() || undefined,
    customLabel2:
      variant.customLabel2?.value?.trim() || undefined,
    customLabel3:
      variant.customLabel3?.value?.trim() || undefined,
    customLabel4:
      variant.customLabel4?.value?.trim() || undefined,
    shippingWeight: buildMerchantShippingWeight(
      variant.weight,
      variant.weightUnit
    )
  }

  let identifierStrategy: MerchantProductIdentifierStrategy

  if (salePrice) {
    productAttributes.price = salePrice.regularPrice
    productAttributes.salePrice = salePrice.salePrice
  } else {
    productAttributes.price = buildMerchantPrice(
      variant.price,
      config.defaults.currencyCode
    )
  }

  if (brand) {
    productAttributes.brand = brand
  }

  if (gtin) {
    productAttributes.gtins = [gtin]
    identifierStrategy = 'gtin'
  } else if (mpn) {
    productAttributes.mpn = mpn
    identifierStrategy = 'mpn'
  } else if (!brand) {
    productAttributes.identifierExists = false
    identifierStrategy = 'identifier_exists_false'
  } else {
    identifierStrategy = 'brand_only'
  }

  return {
    ok: true,
    offerId,
    itemGroupId,
    identifierStrategy,
    productLink,
    input: {
      offerId,
      contentLanguage: config.defaults.contentLanguage,
      feedLabel: config.defaults.feedLabel,
      productAttributes
    }
  }
}
