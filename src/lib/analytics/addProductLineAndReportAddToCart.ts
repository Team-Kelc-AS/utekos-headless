import type { ReportCanonicalAddToCartInput } from './addToCartReporter'
import type {
  Cart,
  CartActionsResult
} from 'types/cart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type AddProductLineAndReportInput = {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  quantity: number
  contextCartId: string | null
  addLines: (
    lines: { variantId: string; quantity: number }[]
  ) => Promise<CartActionsResult>
  getCartIdFromCookie: () => Promise<string | null>
  report: (input: ReportCanonicalAddToCartInput) => () => void
}

export type AddProductLineAndReportResult =
  | {
      success: true
      cart: Cart | null
      cartId: string | null
      message: string
    }
  | {
      success: false
      cart: null
      cartId: null
      message: string
    }

export async function addProductLineAndReportAddToCart(
  input: AddProductLineAndReportInput
): Promise<AddProductLineAndReportResult> {
  const mutationResult = await input.addLines([
    { variantId: input.variant.id, quantity: input.quantity }
  ])

  if (!mutationResult.success) {
    return {
      success: false,
      cart: null,
      cartId: null,
      message:
        mutationResult.message ||
        mutationResult.error ||
        'Kunne ikke legge varen i handlekurven.'
    }
  }

  const cartId =
    mutationResult.cart?.id ??
    input.contextCartId ??
    (await input.getCartIdFromCookie())

  if (cartId) {
    input.report({
      cartId,
      product: input.product,
      quantity: input.quantity,
      variant: input.variant
    })
  }

  return {
    success: true,
    cart: mutationResult.cart ?? null,
    cartId: cartId ?? null,
    message: mutationResult.message
  }
}
