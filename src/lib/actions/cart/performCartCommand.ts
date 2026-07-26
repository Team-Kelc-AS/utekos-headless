import type { StorefrontCart } from '@/api/shopify/types/storefrontApi'
import { performCartClearMutation } from '@/lib/actions/perform/performCartClearMutation'
import { performCartCreateMutation } from '@/lib/actions/perform/performCartCreateMutation'
import { performCartDiscountCodesUpdateMutation } from '@/lib/actions/perform/performCartDiscountCodesUpdateMutation'
import { performCartLinesAddMutation } from '@/lib/actions/perform/performCartLinesAddMutation'
import { performCartLinesRemoveMutation } from '@/lib/actions/perform/performCartLinesRemoveMutation'
import { performCartLinesUpdateMutation } from '@/lib/actions/perform/performCartLinesUpdateMutation'
import { requireCartId } from '@/lib/actions/cart/requireCartId'
import type { CartCommand } from 'types/cart'

export async function performCartCommand(
  command: CartCommand,
  cartId: string | null
): Promise<StorefrontCart> {
  switch (command.type) {
    case 'add-lines': {
      if (!cartId) {
        return performCartCreateMutation(command.lines, command.discountCode)
      }

      const cart = await performCartLinesAddMutation(cartId, command.lines)
      if (!command.discountCode) {
        return cart
      }

      try {
        return await performCartDiscountCodesUpdateMutation(cartId, [
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
      return performCartLinesUpdateMutation(
        requireCartId(cartId),
        command.input
      )
    case 'remove-line':
      return performCartLinesRemoveMutation(requireCartId(cartId), [
        command.input.lineId
      ])
    case 'clear':
      return performCartClearMutation(requireCartId(cartId))
  }
}
