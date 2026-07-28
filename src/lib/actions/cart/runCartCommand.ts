import { getCartIdFromCookie } from '@/lib/actions/getCartIdFromCookie'
import { setCartIdInCookie } from '@/lib/actions/setCartIdInCookie'
import { getCartCommandSuccessMessage } from '@/lib/actions/cart/getCartCommandSuccessMessage'
import { invalidateCartCache } from '@/lib/actions/cart/invalidateCartCache'
import { performCartCommand } from '@/lib/actions/cart/performCartCommand'
import { validateCartCommand } from '@/lib/actions/cart/validateCartCommand'
import { normalizeCart } from '@/lib/helpers/normalizers/normalizeCart'
import type { CartActionsResult, CartCommand } from 'types/cart'

export async function runCartCommand(
  command: CartCommand
): Promise<CartActionsResult> {
  await validateCartCommand(command)

  const existingCartId = await getCartIdFromCookie()
  const rawCart = await performCartCommand(command, existingCartId)

  if (rawCart.id !== existingCartId) {
    await setCartIdInCookie(rawCart.id)
  }

  invalidateCartCache(rawCart.id)

  return {
    success: true,
    message: getCartCommandSuccessMessage(command),
    cart: normalizeCart(rawCart)
  }
}
