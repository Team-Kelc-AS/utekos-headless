// Path: src/lib/analytics/shopifyViewItemCommerce.ts

import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { Money } from 'types/commerce/Money'

export type ShopifyPriceContext = {
  pricesIncludeTax: boolean
  taxRate: number
}

export const UTEKOS_NORWAY_PRICE_CONTEXT = {
  pricesIncludeTax: true,
  taxRate: 0.25
} as const satisfies ShopifyPriceContext

export type CanonicalSelectedOption = {
  name: string
  value: string
}

export type CanonicalCommerceItem = {
  item_id: string
  product_id: string
  variant_id: string
  item_name: string
  item_brand?: string
  item_variant?: string
  item_category?: string
  item_category2?: string
  item_category3?: string
  item_category4?: string
  item_category5?: string
  product_handle: string
  product_type?: string
  sku?: string
  gtin?: string
  quantity: number
  unit_price: number
  gross_unit_price: number
  compare_at_unit_price?: number
  gross_compare_at_unit_price?: number
  discount?: number
  gross_discount?: number
  tax_amount: number
  tax_rate: number
  taxable: boolean
  price_includes_tax: boolean
  available_for_sale: boolean
  currently_not_in_stock: boolean
  quantity_available: number | null
  selected_options: CanonicalSelectedOption[]
  collection_ids: string[]
  collection_titles: string[]
}

export type CanonicalViewItemCommerce = {
  currency: string
  value: number
  gross_value: number
  tax_value: number
  items: [CanonicalCommerceItem]
}

export type MapShopifyViewItemInput = {
  product: ProductCommerceModel
  variant: ProductPurchaseVariant
  quantity?: number
  priceContext?: ShopifyPriceContext
}

type NormalizedMoney = { amount: number; currency: string }

type PriceBreakdown = { net: number; gross: number; tax: number }

export function mapShopifyViewItem({
  product,
  variant,
  quantity = 1,
  priceContext = UTEKOS_NORWAY_PRICE_CONTEXT
}: MapShopifyViewItemInput): CanonicalViewItemCommerce {
  assertQuantity(quantity)
  assertPriceContext(priceContext)

  const price = normalizeMoney(variant.price, 'variant.price')
  const compareAtPrice =
    variant.compareAtPrice ?
      normalizeMoney(
        variant.compareAtPrice,
        'variant.compareAtPrice'
      )
    : undefined

  if (
    compareAtPrice &&
    compareAtPrice.currency !== price.currency
  ) {
    throw new Error(
      'Shopify variant price and compare-at price use different currencies'
    )
  }

  const applicableTaxRate =
    variant.taxable ? priceContext.taxRate : 0

  const currentPrice = calculatePriceBreakdown(
    price.amount,
    applicableTaxRate,
    priceContext.pricesIncludeTax
  )

  const compareAt =
    compareAtPrice ?
      calculatePriceBreakdown(
        compareAtPrice.amount,
        applicableTaxRate,
        priceContext.pricesIncludeTax
      )
    : undefined

  const netDiscount =
    compareAt ?
      roundMoney(Math.max(compareAt.net - currentPrice.net, 0))
    : 0

  const grossDiscount =
    compareAt ?
      roundMoney(
        Math.max(compareAt.gross - currentPrice.gross, 0)
      )
    : 0

  const categories = getCategories(product)
  const sku = optionalText(variant.sku)
  const gtin = optionalText(variant.barcode)
  const brand = optionalText(product.vendor)
  const productType = optionalText(product.productType)
  const variantTitle = normalizeVariantTitle(variant.title)

  const collectionIds = product.collections.nodes.map(
    collection => collection.id
  )

  const collectionTitles = product.collections.nodes
    .map(collection => optionalText(collection.title))
    .filter((title): title is string => Boolean(title))

  const selectedOptions = variant.selectedOptions
    .map(option => ({
      name: option.name.trim(),
      value: option.value.trim()
    }))
    .filter(
      option => option.name.length > 0 && option.value.length > 0
    )

  const item: CanonicalCommerceItem = {
    item_id: variant.id,
    product_id: product.id,
    variant_id: variant.id,
    item_name: product.title.trim(),
    ...(brand ? { item_brand: brand } : {}),
    ...(variantTitle ? { item_variant: variantTitle } : {}),
    ...createCategoryFields(categories),
    product_handle: product.handle,
    ...(productType ? { product_type: productType } : {}),
    ...(sku ? { sku } : {}),
    ...(gtin ? { gtin } : {}),
    quantity,
    unit_price: currentPrice.net,
    gross_unit_price: currentPrice.gross,
    ...(compareAt ?
      {
        compare_at_unit_price: compareAt.net,
        gross_compare_at_unit_price: compareAt.gross
      }
    : {}),
    ...(netDiscount > 0 ? { discount: netDiscount } : {}),
    ...(grossDiscount > 0 ?
      { gross_discount: grossDiscount }
    : {}),
    tax_amount: currentPrice.tax,
    tax_rate: applicableTaxRate,
    taxable: variant.taxable,
    price_includes_tax: priceContext.pricesIncludeTax,
    available_for_sale: variant.availableForSale,
    currently_not_in_stock: variant.currentlyNotInStock,
    quantity_available: variant.quantityAvailable,
    selected_options: selectedOptions,
    collection_ids: collectionIds,
    collection_titles: collectionTitles
  }

  return {
    currency: price.currency,
    value: roundMoney(currentPrice.net * quantity),
    gross_value: roundMoney(currentPrice.gross * quantity),
    tax_value: roundMoney(currentPrice.tax * quantity),
    items: [item]
  }
}

function normalizeMoney(
  money: Money,
  fieldName: string
): NormalizedMoney {
  const amount = Number(money.amount)
  const currency = String(money.currencyCode)
    .trim()
    .toUpperCase()

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(
      `${fieldName} must contain a non-negative amount`
    )
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(
      `${fieldName} must contain a valid ISO currency code`
    )
  }

  return { amount: roundMoney(amount), currency }
}

function calculatePriceBreakdown(
  sourceAmount: number,
  taxRate: number,
  pricesIncludeTax: boolean
): PriceBreakdown {
  if (taxRate === 0) {
    const amount = roundMoney(sourceAmount)

    return { net: amount, gross: amount, tax: 0 }
  }

  const net =
    pricesIncludeTax ?
      roundMoney(sourceAmount / (1 + taxRate))
    : roundMoney(sourceAmount)

  const gross =
    pricesIncludeTax ?
      roundMoney(sourceAmount)
    : roundMoney(sourceAmount * (1 + taxRate))

  return { net, gross, tax: roundMoney(gross - net) }
}

function getCategories(product: ProductCommerceModel): string[] {
  const candidates = [
    product.productType,
    ...product.collections.nodes.map(
      collection => collection.title
    )
  ]

  return Array.from(
    new Set(
      candidates
        .map(optionalText)
        .filter((category): category is string =>
          Boolean(category)
        )
    )
  ).slice(0, 5)
}

function createCategoryFields(
  categories: string[]
): Pick<
  CanonicalCommerceItem,
  | 'item_category'
  | 'item_category2'
  | 'item_category3'
  | 'item_category4'
  | 'item_category5'
> {
  return {
    ...(categories[0] ? { item_category: categories[0] } : {}),
    ...(categories[1] ? { item_category2: categories[1] } : {}),
    ...(categories[2] ? { item_category3: categories[2] } : {}),
    ...(categories[3] ? { item_category4: categories[3] } : {}),
    ...(categories[4] ? { item_category5: categories[4] } : {})
  }
}

function normalizeVariantTitle(
  value: string
): string | undefined {
  const title = optionalText(value)

  if (!title || title.toLowerCase() === 'default title') {
    return undefined
  }

  return title
}

function optionalText(
  value: string | null | undefined
): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(
      'View-item quantity must be a positive integer'
    )
  }
}

function assertPriceContext(context: ShopifyPriceContext): void {
  if (
    !Number.isFinite(context.taxRate) ||
    context.taxRate < 0 ||
    context.taxRate > 1
  ) {
    throw new Error('Tax rate must be between 0 and 1')
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
