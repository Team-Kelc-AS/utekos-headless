import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import type { StorefrontBuyerContext } from '@/api/shopify/storefront/StorefrontGatewayContract'
import { requireCartId } from '@/lib/actions/cart/requireCartId'
import { isShopifyCartNotFoundError } from '@/lib/errors/isShopifyCartNotFoundError'
import type { CartCommand } from 'types/cart'
import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'

type AddLinesCommand = Extract<
  CartCommand,
  { type: 'add-lines' }
>
type UpdateLineCommand = Extract<
  CartCommand,
  { type: 'update-line' }
>

type PerformCartCommandDependencies = {
  clearCart: (
    context: StorefrontBuyerContext,
    cartId: string
  ) => Promise<StorefrontCart>
  createCart: (
    context: StorefrontBuyerContext,
    lines: AddLinesCommand['lines'],
    discountCode?: string
  ) => Promise<StorefrontCart>
  updateDiscountCodes: (
    context: StorefrontBuyerContext,
    cartId: string,
    discountCodes: string[]
  ) => Promise<StorefrontCart>
  addLines: (
    context: StorefrontBuyerContext,
    cartId: string,
    lines: AddLinesCommand['lines']
  ) => Promise<StorefrontCart>
  removeLines: (
    context: StorefrontBuyerContext,
    cartId: string,
    lineIds: string[]
  ) => Promise<StorefrontCart>
  updateLines: (
    context: StorefrontBuyerContext,
    cartId: string,
    input: UpdateLineCommand['input']
  ) => Promise<StorefrontCart>
}

async function loadDefaultDependencies(): Promise<PerformCartCommandDependencies> {
  const [
    { performCartClearMutation },
    { performCartCreateMutation },
    { performCartDiscountCodesUpdateMutation },
    { performCartLinesAddMutation },
    { performCartLinesRemoveMutation },
    { performCartLinesUpdateMutation }
  ] = await Promise.all([
    import('@/lib/actions/perform/performCartClearMutation'),
    import('@/lib/actions/perform/performCartCreateMutation'),
    import('@/lib/actions/perform/performCartDiscountCodesUpdateMutation'),
    import('@/lib/actions/perform/performCartLinesAddMutation'),
    import('@/lib/actions/perform/performCartLinesRemoveMutation'),
    import('@/lib/actions/perform/performCartLinesUpdateMutation')
  ])

  return {
    clearCart: performCartClearMutation,
    createCart: performCartCreateMutation,
    updateDiscountCodes: performCartDiscountCodesUpdateMutation,
    addLines: performCartLinesAddMutation,
    removeLines: performCartLinesRemoveMutation,
    updateLines: performCartLinesUpdateMutation
  }
}

export async function performCartCommand(
  command: CartCommand,
  cartId: string | null,
  context: StorefrontBuyerContext,
  dependencies?: PerformCartCommandDependencies
): Promise<StorefrontCart> {
  const resolvedDependencies =
    dependencies ?? (await loadDefaultDependencies())

  switch (command.type) {
    case 'add-lines': {
      if (!cartId) {
        return resolvedDependencies.createCart(
          context,
          command.lines,
          command.discountCode
        )
      }

      let cart: StorefrontCart

      try {
        cart = await resolvedDependencies.addLines(
          context,
          cartId,
          command.lines
        )
      } catch (error) {
        if (!isShopifyCartNotFoundError(error)) {
          throw error
        }

        return resolvedDependencies.createCart(
          context,
          command.lines,
          command.discountCode
        )
      }

      if (!command.discountCode) {
        return cart
      }

      try {
        return await resolvedDependencies.updateDiscountCodes(
          context,
          cartId,
          [command.discountCode]
        )
      } catch (error) {
        console.error(
          'Cart lines were added, but the discount code update failed.',
          getRedactedErrorSummary(error)
        )
        return cart
      }
    }
    case 'update-line':
      return resolvedDependencies.updateLines(
        context,
        requireCartId(cartId),
        command.input
      )
    case 'remove-line':
      return resolvedDependencies.removeLines(
        context,
        requireCartId(cartId),
        [command.input.lineId]
      )
    case 'clear':
      return resolvedDependencies.clearCart(
        context,
        requireCartId(cartId)
      )
  }
}
