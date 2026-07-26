import type { CartActionsResult } from 'types/cart/CartActions'

export type ResolveSuccessfulCartRemovalQuantityInput = {
  lineId: string
  previousQuantity: number
  result: CartActionsResult | null | undefined
}

/**
 * Uses Shopify's returned cart as the sole authority for the removed delta.
 * A missing line in a successful response is quantity zero; a failed or
 * incomplete response never produces a removal event.
 */
export function resolveSuccessfulCartRemovalQuantity(
  input: ResolveSuccessfulCartRemovalQuantityInput
) {
  if (
    !input.result?.success ||
    !input.result.cart ||
    !Number.isInteger(input.previousQuantity) ||
    input.previousQuantity < 1
  ) {
    return 0
  }

  const actualQuantity =
    input.result.cart.lines.find(line => line.id === input.lineId)
      ?.quantity ?? 0

  if (!Number.isInteger(actualQuantity) || actualQuantity < 0) {
    return 0
  }

  return Math.max(0, input.previousQuantity - actualQuantity)
}
