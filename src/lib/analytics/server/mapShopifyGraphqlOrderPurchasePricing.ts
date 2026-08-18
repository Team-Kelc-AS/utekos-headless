import type {
  ShopifyCommerceReconciliationMoneyBag,
  ShopifyCommerceReconciliationOrder
} from './shopifyCommerceReconciliationGraphqlSchema'

const MONEY_PRECISION = 1_000_000

export function readShopifyGraphqlMoneyAmount(
  moneyBag:
    | ShopifyCommerceReconciliationMoneyBag
    | null
    | undefined,
  currency: string,
  fieldName: string
) {
  const normalizedCurrency = currency.trim().toUpperCase()

  if (!moneyBag) {
    throw new Error(
      `Shopify ${fieldName} is missing a valid ${normalizedCurrency} amount`
    )
  }

  const money = [
    moneyBag.presentmentMoney,
    moneyBag.shopMoney
  ].find(
    candidate =>
      candidate.currencyCode.toUpperCase() === normalizedCurrency
  )

  const amount = Number(money?.amount)

  if (!money || !Number.isFinite(amount) || amount < 0) {
    throw new Error(
      `Shopify ${fieldName} is missing a valid ${normalizedCurrency} amount`
    )
  }

  return amount
}

function roundMoney(value: number) {
  const rounded =
    Math.round(value * MONEY_PRECISION) / MONEY_PRECISION
  return Object.is(rounded, -0) ? 0 : rounded
}

function lineTaxRate(
  lineItem: ShopifyCommerceReconciliationOrder['lineItems']['nodes'][number]
) {
  return lineItem.taxLines.reduce((total, taxLine) => {
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

function allocationMethodFor(
  allocation: ShopifyCommerceReconciliationOrder['lineItems']['nodes'][number]['discountAllocations'][number]
) {
  if (
    allocation.discountApplication.targetType.toLowerCase() !==
    'line_item'
  ) {
    throw new Error(
      'Shopify line item discount allocation must target a line item'
    )
  }

  const allocationMethod =
    allocation.discountApplication.allocationMethod.toLowerCase()

  if (
    allocationMethod !== 'each' &&
    allocationMethod !== 'across'
  ) {
    throw new Error(
      `Unsupported Shopify discount allocation method: ${allocation.discountApplication.allocationMethod}`
    )
  }

  return allocationMethod
}

function mapPurchaseItem(
  order: ShopifyCommerceReconciliationOrder,
  lineItem: ShopifyCommerceReconciliationOrder['lineItems']['nodes'][number],
  currency: string
) {
  if (lineItem.quantity <= 0) return undefined

  const itemName =
    lineItem.name?.trim() || lineItem.title?.trim()
  const itemBrand =
    lineItem.vendor?.trim() || lineItem.product?.vendor.trim()
  const itemCategory = lineItem.product?.productType.trim()

  if (!itemName) {
    throw new Error('Shopify GraphQL line item requires a name')
  }

  const grossUnitPrice = readShopifyGraphqlMoneyAmount(
    lineItem.originalUnitPriceSet,
    currency,
    'line item price'
  )
  const taxRate = lineTaxRate(lineItem)
  const netUnitPriceBeforeDiscount = excludeIncludedTax(
    grossUnitPrice,
    order.taxesIncluded,
    taxRate
  )
  let grossDiscountTotal = 0
  let netDiscountTotal = 0
  let netItemScopedDiscountTotal = 0

  for (const allocation of lineItem.discountAllocations) {
    const grossDiscount = readShopifyGraphqlMoneyAmount(
      allocation.allocatedAmountSet,
      currency,
      'discount allocation'
    )
    const netDiscount = excludeIncludedTax(
      grossDiscount,
      order.taxesIncluded,
      taxRate
    )
    const allocationMethod = allocationMethodFor(allocation)

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

  return {
    item: {
      item_id:
        lineItem.variant?.legacyResourceId ?
          String(lineItem.variant.legacyResourceId)
        : String(lineItem.id),
      item_name: itemName,
      quantity: lineItem.quantity,
      unit_price: unitPrice,
      final_unit_price: finalUnitPrice,
      ...(discount > 0 ? { discount } : {}),
      ...(lineItem.sku ? { sku: lineItem.sku } : {}),
      ...(itemBrand ? { item_brand: itemBrand } : {}),
      ...(itemCategory ? { item_category: itemCategory } : {})
    },
    netDiscountTotal: roundMoney(netDiscountTotal),
    netRevenue
  }
}

function couponCodes(order: ShopifyCommerceReconciliationOrder) {
  const codes = [
    ...(order.discountCodes ?? []),
    ...order.discountApplications.nodes.map(
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

export function mapShopifyGraphqlOrderPurchasePricing(
  order: ShopifyCommerceReconciliationOrder,
  currency: string
) {
  const mapped = order.lineItems.nodes
    .map(lineItem => mapPurchaseItem(order, lineItem, currency))
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
