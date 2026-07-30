import {
  klarnaExpressOrderPayloadSchema,
  type KlarnaExpressOrderPayload,
  type KlarnaOrderLine
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import { getKlarnaSiteOrigin } from '@/components/klarna/utils/getKlarnaSiteOrigin'
import type { Cart } from 'types/cart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type BuildLineInput = {
  name: string
  quantity: number
  unitPriceAmount: string
  currencyCode: string
  reference?: string
}

function buildKlarnaOrderLine({
  name,
  quantity,
  unitPriceAmount,
  currencyCode,
  reference
}: BuildLineInput): KlarnaOrderLine | null {
  const unitPriceMinor = getKlarnaMinorUnitAmount({
    amount: unitPriceAmount,
    currencyCode
  })

  if (!unitPriceMinor) {
    return null
  }

  const unit_price = Number(unitPriceMinor)
  const total_amount = unit_price * quantity

  return {
    name,
    quantity,
    unit_price,
    total_amount,
    type: 'physical',
    ...(reference ? { reference } : {})
  }
}

function buildMerchantUrls(): KlarnaExpressOrderPayload['merchant_urls'] {
  const origin = getKlarnaSiteOrigin()

  return {
    confirmation: `${origin}/kjop/fullfort?klarna_order_id={order.id}`,
    notification: `${origin}/api/klarna/notifications?klarna_order_id={order.id}`
  }
}

export function buildKlarnaExpressOrderPayloadFromCart(
  cart: Cart,
  options?: { merchantReference1?: string }
): KlarnaExpressOrderPayload {
  const currencyCode = cart.cost.totalAmount.currencyCode
  const orderLines = cart.lines
    .map(line => {
      const productTitle = line.merchandise.product.title
      const variantTitle = line.merchandise.title
      const name =
        variantTitle && variantTitle !== 'Default Title' ?
          `${productTitle} — ${variantTitle}`
        : productTitle

      return buildKlarnaOrderLine({
        name,
        quantity: line.quantity,
        unitPriceAmount: line.merchandise.price.amount,
        currencyCode,
        reference: line.merchandise.id
      })
    })
    .filter((line): line is KlarnaOrderLine => line !== null)

  const orderAmountMinor = getKlarnaMinorUnitAmount({
    amount: cart.cost.totalAmount.amount,
    currencyCode
  })

  if (!orderAmountMinor || orderLines.length === 0) {
    throw new Error(
      'Cart cannot be converted to a Klarna express order payload'
    )
  }

  const payload = klarnaExpressOrderPayloadSchema.parse({
    purchase_country: 'NO',
    purchase_currency: currencyCode.toUpperCase(),
    locale: 'nb-NO',
    order_amount: Number(orderAmountMinor),
    order_lines: orderLines,
    merchant_reference1: options?.merchantReference1 ?? cart.id,
    merchant_urls: buildMerchantUrls()
  })

  return payload
}

type ProductLineInput = {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  quantity: number
  merchantReference1?: string
}

export function buildKlarnaExpressOrderPayloadFromProductLine({
  product,
  variant,
  quantity,
  merchantReference1
}: ProductLineInput): KlarnaExpressOrderPayload {
  const currencyCode = variant.price.currencyCode
  const variantTitle = variant.title
  const name =
    variantTitle && variantTitle !== 'Default Title' ?
      `${product.title} — ${variantTitle}`
    : product.title

  const orderLine = buildKlarnaOrderLine({
    name,
    quantity,
    unitPriceAmount: variant.price.amount,
    currencyCode,
    reference: variant.id
  })

  if (!orderLine) {
    throw new Error(
      'Product line cannot be converted to a Klarna express order payload'
    )
  }

  const payload = klarnaExpressOrderPayloadSchema.parse({
    purchase_country: 'NO',
    purchase_currency: currencyCode.toUpperCase(),
    locale: 'nb-NO',
    order_amount: orderLine.total_amount,
    order_lines: [orderLine],
    merchant_reference1: merchantReference1,
    merchant_urls: buildMerchantUrls()
  })

  return payload
}
