import { UTEKOS_NORWAY_PRICE_CONTEXT } from './shopifyViewItemCommerce'
import { mapCartVariantCommerce } from './mapCartVariantCommerce'
import type { CanonicalBeginCheckoutCommerce } from './beginCheckoutEvent'
import type { Cart, CartLine } from 'types/cart'
import type { CartProductVariant } from 'types/cart/CartProductVariant'

export type ShopifyCartValueCommerce = Omit<
  CanonicalBeginCheckoutCommerce,
  'creation_revision'
>

export function resolveCheckoutId(cart: Cart) {
  try {
    const url = new URL(cart.checkoutUrl)
    const segments = url.pathname.split('/').filter(Boolean)
    const token = segments.at(-1)

    if (token) return token
  } catch {
    return cart.id
  }

  return cart.id
}

export function mapShopifyCartValueCommerce(
  cart: Cart
): ShopifyCartValueCommerce {
  const mappableLines = cart.lines.filter(hasMappableMerchandise)

  if (mappableLines.length === 0) {
    throw new Error(
      'Begin checkout requires at least one cart line with product data'
    )
  }

  const currency = normalizeCurrency(
    cart.cost.totalAmount.currencyCode
  )
  const grossValue = parseMoneyAmount(
    cart.cost.totalAmount.amount,
    'cart.cost.totalAmount.amount'
  )
  const lineGrossTotals = mappableLines.map(line => {
    const lineCurrency = normalizeCurrency(
      line.cost.totalAmount.currencyCode
    )
    if (lineCurrency !== currency) {
      throw new Error(
        'Shopify cart and line costs must use the same currency'
      )
    }

    return parseMoneyAmount(
      line.cost.totalAmount.amount,
      'cart.lines.cost.totalAmount.amount'
    )
  })
  const lineGrossTotal = roundMoney(
    lineGrossTotals.reduce((total, amount) => total + amount, 0)
  )
  const cartDiscountRatio =
    lineGrossTotal > grossValue && lineGrossTotal > 0 ?
      grossValue / lineGrossTotal
    : 1
  const mappedItems: ShopifyCartValueCommerce['items'] =
    mappableLines.flatMap((line, index) => {
      const commerce = mapCartVariantCommerce({
        product: line.merchandise.product,
        variant: line.merchandise,
        quantity: line.quantity,
        priceContext: UTEKOS_NORWAY_PRICE_CONTEXT
      })
      const discountedLineGross = roundMoney(
        (lineGrossTotals[index] ?? 0) * cartDiscountRatio
      )

      return commerce.items.map(item =>
        applyAuthoritativeLineCost(
          item,
          discountedLineGross,
          line.quantity
        )
      )
    })
  const netValue = roundMoney(
    grossValue / (1 + UTEKOS_NORWAY_PRICE_CONTEXT.taxRate)
  )
  const taxValue = roundMoney(grossValue - netValue)

  return {
    cart_id: cart.id,
    currency,
    value: netValue,
    gross_value: grossValue,
    tax_value: taxValue,
    items: mappedItems,
    checkout_id: resolveCheckoutId(cart)
  }
}

function applyAuthoritativeLineCost(
  item: ShopifyCartValueCommerce['items'][number],
  grossLineTotal: number,
  quantity: number
) {
  const taxRate =
    item.taxable ? UTEKOS_NORWAY_PRICE_CONTEXT.taxRate : 0
  const grossUnitPrice = roundMoney(grossLineTotal / quantity)
  const unitPrice = roundMoney(grossUnitPrice / (1 + taxRate))
  const taxAmount = roundMoney(grossUnitPrice - unitPrice)
  const grossReferencePrice =
    item.gross_compare_at_unit_price ?? item.gross_unit_price
  const grossDiscount = roundMoney(
    Math.max(grossReferencePrice - grossUnitPrice, 0)
  )
  const referencePrice = roundMoney(
    grossReferencePrice / (1 + taxRate)
  )
  const discount = roundMoney(
    Math.max(referencePrice - unitPrice, 0)
  )
  const mappedItem = {
    ...item,
    unit_price: unitPrice,
    gross_unit_price: grossUnitPrice,
    tax_amount: taxAmount,
    ...(discount > 0 ? { discount } : {}),
    ...(grossDiscount > 0 ? { gross_discount: grossDiscount } : {})
  }

  if (discount === 0) delete mappedItem.discount
  if (grossDiscount === 0) delete mappedItem.gross_discount

  return mappedItem
}

function hasMappableMerchandise(
  line: CartLine
): line is CartLine & {
  merchandise: CartProductVariant & {
    product: CartProductVariant['product']
  }
} {
  return Boolean(line.merchandise?.product?.id)
}

function normalizeCurrency(value: string) {
  const currency = value.trim().toUpperCase()

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error('Cart currency must be a valid ISO currency code')
  }

  return currency
}

function parseMoneyAmount(value: string, fieldName: string) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${fieldName} must contain a non-negative amount`)
  }

  return roundMoney(amount)
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
