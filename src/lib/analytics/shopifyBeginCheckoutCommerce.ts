import { createHash } from 'node:crypto'
import { UTEKOS_NORWAY_PRICE_CONTEXT } from './shopifyViewItemCommerce'
import { mapCartVariantCommerce } from './mapCartVariantCommerce'
import type { CanonicalBeginCheckoutCommerce } from './beginCheckoutEvent'
import type { Cart, CartLine } from 'types/cart'
import type { CartProductVariant } from 'types/cart/CartProductVariant'

export function createCheckoutCreationRevision(
  checkoutId: string,
  checkoutUrl: string
) {
  const material = [checkoutId, checkoutUrl].join('|')
  const hash = createHash('sha256').update(material).digest('hex')

  return `checkout_rev_${hash.slice(0, 32)}`
}

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

export function mapShopifyBeginCheckout(
  cart: Cart
): CanonicalBeginCheckoutCommerce {
  const mappableLines = cart.lines.filter(hasMappableMerchandise)

  if (mappableLines.length === 0) {
    throw new Error(
      'Begin checkout requires at least one cart line with product data'
    )
  }

  const mappedItems = mappableLines.map(line =>
    mapCartVariantCommerce({
      product: line.merchandise.product,
      variant: line.merchandise,
      quantity: line.quantity,
      priceContext: UTEKOS_NORWAY_PRICE_CONTEXT
    })
  )

  const currency = normalizeCurrency(cart.cost.subtotalAmount.currencyCode)
  const grossSubtotal = parseMoneyAmount(
    cart.cost.subtotalAmount.amount,
    'cart.cost.subtotalAmount.amount'
  )
  const grossTotal = parseMoneyAmount(
    cart.cost.totalAmount.amount,
    'cart.cost.totalAmount.amount'
  )
  const grossValue = roundMoney(Math.max(grossSubtotal, grossTotal))
  const netValue = roundMoney(
    grossValue / (1 + UTEKOS_NORWAY_PRICE_CONTEXT.taxRate)
  )
  const taxValue = roundMoney(grossValue - netValue)
  const checkoutId = resolveCheckoutId(cart)

  return {
    cart_id: cart.id,
    currency,
    value: netValue,
    gross_value: grossValue,
    tax_value: taxValue,
    items: mappedItems.flatMap(commerce => commerce.items),
    checkout_id: checkoutId,
    creation_revision: createCheckoutCreationRevision(
      checkoutId,
      cart.checkoutUrl
    )
  }
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
