import { createHash } from 'node:crypto'
import { createCartMutationId } from '../shopifyAddToCartCommerce'
import {
  canonicalRemoveFromCartSchema,
  type CanonicalRemoveFromCart
} from '../removeFromCartEvent'
import { UTEKOS_NORWAY_PRICE_CONTEXT } from '../shopifyViewItemCommerce'
import { resolveCanonicalEnvironment } from './resolveCanonicalEnvironment'
import type { ShopifyCartSnapshotLine } from './shopifyCartSnapshotStore'

const deniedConsentSnapshot = {
  analytics: 'denied',
  marketing: 'denied',
  preferences: 'denied',
  source: 'cookiebot',
  version: '1'
} as const

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function parseUnitPrice(raw: string) {
  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('invalid_cart_line_price')
  }
  return roundMoney(amount)
}

function priceBreakdown(grossUnitPrice: number, taxable: boolean) {
  const taxRate =
    taxable ? UTEKOS_NORWAY_PRICE_CONTEXT.taxRate : 0

  if (taxRate === 0) {
    return { net: grossUnitPrice, gross: grossUnitPrice, tax: 0, taxRate }
  }

  const net = roundMoney(grossUnitPrice / (1 + taxRate))
  const gross = roundMoney(grossUnitPrice)
  return {
    net,
    gross,
    tax: roundMoney(gross - net),
    taxRate
  }
}

export function deterministicRemoveFromCartEventId(input: {
  cartToken: string
  quantityRemoved: number
  updatedAt: string
  variantId: string
}) {
  const hash = createHash('sha256')
    .update(
      [
        'utekos:remove_from_cart',
        input.cartToken,
        input.variantId,
        String(input.quantityRemoved),
        input.updatedAt
      ].join(':')
    )
    .digest()
  const bytes = Uint8Array.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function toShopifyGid(resource: 'Product' | 'ProductVariant', id: string) {
  if (id.startsWith('gid://')) return id
  return `gid://shopify/${resource}/${id}`
}

function resolveCurrency(line: ShopifyCartSnapshotLine) {
  return line.currency_code ?? 'NOK'
}

export async function shopifyCartRemovalToCanonicalRemoveFromCart(input: {
  cartToken: string
  priorLine: ShopifyCartSnapshotLine
  quantityRemoved: number
  updatedAt: string
}): Promise<CanonicalRemoveFromCart> {
  if (input.quantityRemoved < 1) {
    throw new Error('invalid_quantity_removed')
  }

  const taxable = input.priorLine.taxable ?? true
  const grossUnit = parseUnitPrice(input.priorLine.price)
  const breakdown = priceBreakdown(grossUnit, taxable)
  const quantity = input.quantityRemoved
  const currency = resolveCurrency(input.priorLine)
  const variantId = toShopifyGid(
    'ProductVariant',
    input.priorLine.variant_id
  )
  const productId = toShopifyGid('Product', input.priorLine.product_id)
  const cartId = input.cartToken.startsWith('gid://')
    ? input.cartToken
    : `gid://shopify/Cart/${input.cartToken}`

  const eventId = deterministicRemoveFromCartEventId({
    cartToken: input.cartToken,
    quantityRemoved: quantity,
    updatedAt: input.updatedAt,
    variantId: input.priorLine.variant_id
  })

  const eventTime = new Date(input.updatedAt).toISOString()

  return canonicalRemoveFromCartSchema.parse({
    schema_version: 1,
    event_name: 'remove_from_cart',
    event_id: eventId,
    event_time: eventTime,
    source: 'webhook',
    environment: resolveCanonicalEnvironment(),
    consent: deniedConsentSnapshot,
    custom_data: {
      currency,
      value: roundMoney(breakdown.net * quantity),
      gross_value: roundMoney(breakdown.gross * quantity),
      tax_value: roundMoney(breakdown.tax * quantity),
      cart_id: cartId,
      cart_mutation_id: await createCartMutationId({
        cartId,
        cartUpdatedAt: input.updatedAt,
        mutationTimestamp: eventTime,
        quantity,
        variantId
      }),
      items: [
        {
          item_id: variantId,
          product_id: productId,
          variant_id: variantId,
          item_name: input.priorLine.title,
          ...(input.priorLine.vendor ?
            { item_brand: input.priorLine.vendor }
          : {}),
          product_handle: `shopify-product-${input.priorLine.product_id}`,
          ...(input.priorLine.sku ?
            { sku: input.priorLine.sku }
          : {}),
          quantity,
          unit_price: breakdown.net,
          gross_unit_price: breakdown.gross,
          tax_amount: breakdown.tax,
          tax_rate: breakdown.taxRate,
          taxable,
          price_includes_tax:
            UTEKOS_NORWAY_PRICE_CONTEXT.pricesIncludeTax,
          available_for_sale: true,
          currently_not_in_stock: false,
          quantity_available: null,
          selected_options: [],
          collection_ids: [],
          collection_titles: []
        }
      ]
    }
  })
}
