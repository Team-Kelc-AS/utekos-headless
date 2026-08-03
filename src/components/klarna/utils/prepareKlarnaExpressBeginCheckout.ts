import { addProductLineAndReportAddToCart } from '@/lib/analytics/addProductLineAndReportAddToCart'
import type { ReportCanonicalAddToCartInput } from '@/lib/analytics/addToCartReporter'
import type { ReportCanonicalBeginCheckoutInput } from '@/lib/analytics/beginCheckoutReporter'
import { buildKlarnaExpressOrderPayloadFromCart } from '@/components/klarna/utils/buildKlarnaExpressOrderPayload'
import type { KlarnaExpressOrderPayload } from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import type {
  Cart,
  CartActionsResult
} from 'types/cart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type PrepareKlarnaExpressBeginCheckoutInput = {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  quantity: number
  contextCartId: string | null
  addLines: (
    lines: { variantId: string; quantity: number }[]
  ) => Promise<CartActionsResult>
  getCartIdFromCookie: () => Promise<string | null>
  reportAddToCart: (
    input: ReportCanonicalAddToCartInput
  ) => () => void
  reportBeginCheckout: (
    input: ReportCanonicalBeginCheckoutInput
  ) => Promise<void>
}

export type PrepareKlarnaExpressBeginCheckoutResult =
  | {
      ok: true
      orderPayload: KlarnaExpressOrderPayload
      shopifyCartId: string
      cart: Cart
    }
  | {
      ok: false
      orderPayload: null
      shopifyCartId: null
      cart: null
      message: string
    }

export async function prepareKlarnaExpressBeginCheckout(
  input: PrepareKlarnaExpressBeginCheckoutInput
): Promise<PrepareKlarnaExpressBeginCheckoutResult> {
  const addResult = await addProductLineAndReportAddToCart({
    product: input.product,
    variant: input.variant,
    quantity: input.quantity,
    contextCartId: input.contextCartId,
    addLines: input.addLines,
    getCartIdFromCookie: input.getCartIdFromCookie,
    report: input.reportAddToCart
  })

  if (!addResult.success || !addResult.cart) {
    return {
      ok: false,
      orderPayload: null,
      shopifyCartId: null,
      cart: null,
      message:
        addResult.message ||
        'Kunne ikke forberede Klarna-kassen med handlekurven.'
    }
  }

  let orderPayload: KlarnaExpressOrderPayload

  try {
    orderPayload = buildKlarnaExpressOrderPayloadFromCart(
      addResult.cart
    )
  } catch {
    return {
      ok: false,
      orderPayload: null,
      shopifyCartId: null,
      cart: null,
      message:
        'Handlekurven kunne ikke konverteres til Klarna-ordre.'
    }
  }

  await input.reportBeginCheckout({
    cart: addResult.cart,
    checkoutMethod: 'klarna_express'
  })

  return {
    ok: true,
    orderPayload,
    shopifyCartId: addResult.cart.id,
    cart: addResult.cart
  }
}
