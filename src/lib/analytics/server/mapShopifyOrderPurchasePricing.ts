import type { OrderPaid } from 'types/commerce/order/OrderPaid'
import type { LineItem } from 'types/commerce/order/LineItem'
import { readShopifyMoneyAmount } from './readShopifyMoneyAmount'
import type { CheckoutProductContextItem } from '../checkoutProductContext'

const MONEY_PRECISION = 1_000_000

function roundMoney(value: number) {
  const rounded =
    Math.round(value * MONEY_PRECISION) / MONEY_PRECISION
  return Object.is(rounded, -0) ? 0 : rounded
}

function lineTaxRate(lineItem: LineItem) {
  return lineItem.tax_lines.reduce((total, taxLine) => {
    const rate = Number(taxLine.rate)

    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error(
        'Shopify line item has an invalid tax rate'
      )
    }

    return total + rate
  }, 0)
}

function excludeIncludedTax(
  amount: number,
  taxesIncluded: boolean,
  taxRate: number
) {
  return taxesIncluded ? amount / (1 + taxRate) : amount
}

function discountApplicationFor(
  order: OrderPaid,
  index: number
) {
  const application = order.discount_applications[index]

  if (!application) {
    throw new Error(
      `Shopify discount allocation references missing application ${index}`
    )
  }

  if (application.target_type.toLowerCase() !== 'line_item') {
    throw new Error(
      'Shopify line item discount allocation must target a line item'
    )
  }

  const allocationMethod =
    application.allocation_method.toLowerCase()

  if (
    allocationMethod !== 'each' &&
    allocationMethod !== 'across'
  ) {
    throw new Error(
      `Unsupported Shopify discount allocation method: ${application.allocation_method}`
    )
  }

  return allocationMethod
}

function mapPurchaseItem(
  order: OrderPaid,
  lineItem: LineItem,
  currency: string,
  productContext: ReadonlyMap<string, CheckoutProductContextItem>
) {
  if (lineItem.quantity <= 0) return undefined

  const grossUnitPrice = readShopifyMoneyAmount(
    lineItem.price_set,
    currency,
    'line item price'
  )
  const taxRate = lineTaxRate(lineItem)
  const netUnitPriceBeforeDiscount = excludeIncludedTax(
    grossUnitPrice,
    order.taxes_included,
    taxRate
  )
  let grossDiscountTotal = 0
  let netDiscountTotal = 0
  let netItemScopedDiscountTotal = 0

  for (const allocation of lineItem.discount_allocations) {
    const grossDiscount = readShopifyMoneyAmount(
      allocation.amount_set,
      currency,
      'discount allocation'
    )
    const netDiscount = excludeIncludedTax(
      grossDiscount,
      order.taxes_included,
      taxRate
    )
    const allocationMethod = discountApplicationFor(
      order,
      allocation.discount_application_index
    )

    grossDiscountTotal += grossDiscount
    netDiscountTotal += netDiscount

    if (allocationMethod === 'each') {
      netItemScopedDiscountTotal += netDiscount
    }
  }

  const grossLineValue = grossUnitPrice * lineItem.quantity
  const netLineValueBeforeDiscount =
    netUnitPriceBeforeDiscount * lineItem.quantity

  if (
    grossDiscountTotal > grossLineValue + Number.EPSILON ||
    netDiscountTotal >
      netLineValueBeforeDiscount + Number.EPSILON
  ) {
    throw new Error(
      'Shopify line item discounts exceed the line item value'
    )
  }

  const unitPrice = roundMoney(
    Math.max(
      0,
      netUnitPriceBeforeDiscount -
        netItemScopedDiscountTotal / lineItem.quantity
    )
  )
  const finalUnitPrice = roundMoney(
    Math.max(
      0,
      (grossLineValue - grossDiscountTotal) / lineItem.quantity
    )
  )
  const discount = roundMoney(
    netItemScopedDiscountTotal / lineItem.quantity
  )
  const netRevenue = roundMoney(
    Math.max(0, netLineValueBeforeDiscount - netDiscountTotal)
  )

  const itemId =
    lineItem.variant_id !== null ?
      String(lineItem.variant_id)
    : String(lineItem.id)
  const context = productContext.get(itemId)
  const itemBrand =
    context?.item_brand ?? lineItem.vendor?.trim()

  return {
    item: {
      item_id: itemId,
      item_name: lineItem.name || lineItem.title,
      quantity: lineItem.quantity,
      unit_price: unitPrice,
      final_unit_price: finalUnitPrice,
      ...(discount > 0 ? { discount } : {}),
      ...(lineItem.sku ? { sku: lineItem.sku } : {}),
      ...(itemBrand ? { item_brand: itemBrand } : {}),
      ...(context?.item_category ?
        { item_category: context.item_category }
      : {})
    },
    netDiscountTotal: roundMoney(netDiscountTotal),
    netRevenue
  }
}

function couponCodes(order: OrderPaid) {
  const codes = [
    ...(order.discount_codes ?? []).map(
      discount => discount.code
    ),
    ...order.discount_applications.map(
      application => application.code
    )
  ]

  return [
    ...new Set(
      codes
        .map(code => code?.trim())
        .filter((code): code is string => Boolean(code))
        .map(code => Array.from(code).slice(0, 100).join(''))
    )
  ].slice(0, 10)
}

export function mapShopifyOrderPurchasePricing(
  order: OrderPaid,
  currency: string,
  productContext: ReadonlyMap<
    string,
    CheckoutProductContextItem
  > = new Map()
) {
  const mapped = order.line_items
    .map(lineItem =>
      mapPurchaseItem(order, lineItem, currency, productContext)
    )
    .filter(
      (item): item is NonNullable<typeof item> =>
        item !== undefined
    )

  if (mapped.length === 0) {
    throw new Error(
      'Shopify order purchase mapping requires at least one line item'
    )
  }

  const itemRevenue = roundMoney(
    mapped.reduce((total, entry) => total + entry.netRevenue, 0)
  )
  const transactionDiscount = roundMoney(
    mapped.reduce(
      (total, entry) => total + entry.netDiscountTotal,
      0
    )
  )
  const appliedCouponCodes = couponCodes(order)

  return {
    items: mapped.map(entry => entry.item),
    itemRevenue,
    ...(transactionDiscount > 0 ? { transactionDiscount } : {}),
    ...(appliedCouponCodes.length > 0 ?
      { couponCodes: appliedCouponCodes }
    : {})
  }
}
