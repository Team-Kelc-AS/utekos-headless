import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { performCartClearMutation } from '@/lib/actions/perform/performCartClearMutation'
import { performCartCreateMutation } from '@/lib/actions/perform/performCartCreateMutation'
import { performCartDiscountCodesUpdateMutation } from '@/lib/actions/perform/performCartDiscountCodesUpdateMutation'
import { performCartLinesAddMutation } from '@/lib/actions/perform/performCartLinesAddMutation'
import { performCartLinesRemoveMutation } from '@/lib/actions/perform/performCartLinesRemoveMutation'
import { performCartLinesUpdateMutation } from '@/lib/actions/perform/performCartLinesUpdateMutation'
import { requireCartId } from '@/lib/actions/cart/requireCartId'
import { isShopifyCartNotFoundError } from '@/lib/errors/isShopifyCartNotFoundError'
import type { CartCommand } from 'types/cart'

type PerformCartCommandDependencies = {
  clearCart: typeof performCartClearMutation
  createCart: typeof performCartCreateMutation
  updateDiscountCodes: typeof performCartDiscountCodesUpdateMutation
  addLines: typeof performCartLinesAddMutation
  removeLines: typeof performCartLinesRemoveMutation
  updateLines: typeof performCartLinesUpdateMutation
}

const defaultDependencies: PerformCartCommandDependencies = {
  clearCart: performCartClearMutation,
  createCart: performCartCreateMutation,
  updateDiscountCodes: performCartDiscountCodesUpdateMutation,
  addLines: performCartLinesAddMutation,
  removeLines: performCartLinesRemoveMutation,
  updateLines: performCartLinesUpdateMutation
}

export async function performCartCommand(
  command: CartCommand,
  cartId: string | null,
  dependencies: PerformCartCommandDependencies =
    defaultDependencies
): Promise<StorefrontCart> {
  switch (command.type) {
    case 'add-lines': {
      if (!cartId) {
        return dependencies.createCart(
          command.lines,
          command.discountCode
        )
      }

      let cart: StorefrontCart

      try {
        cart = await dependencies.addLines(cartId, command.lines)
      } catch (error) {
        if (!isShopifyCartNotFoundError(error)) {
          throw error
        }

        return dependencies.createCart(
          command.lines,
          command.discountCode
        )
      }

      if (!command.discountCode) {
        return cart
      }

      try {
        return await dependencies.updateDiscountCodes(cartId, [
          command.discountCode
        ])
      } catch (error) {
        console.error(
          'Cart lines were added, but the discount code update failed.',
          error
        )
        return cart
      }
    }
    case 'update-line':
      return dependencies.updateLines(
        requireCartId(cartId),
        command.input
      )
    case 'remove-line':
      return dependencies.removeLines(requireCartId(cartId), [
        command.input.lineId
      ])
    case 'clear':
      return dependencies.clearCart(requireCartId(cartId))
  }
}
