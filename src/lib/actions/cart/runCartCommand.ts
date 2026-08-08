import { setCartIdInCookie } from '@/lib/actions/cart/setCartIdInCookie'
import { getCartCommandSuccessMessage } from '@/lib/actions/cart/getCartCommandSuccessMessage'
import { invalidateCartCache } from '@/lib/actions/cart/invalidateCartCache'
import { performCartCommand } from '@/lib/actions/cart/performCartCommand'
import { validateCartCommand } from '@/lib/actions/cart/validateCartCommand'
import { normalizeCart } from '@/lib/helpers/normalizers/normalizeCart'
import { readCartIdCookie } from '@/lib/cart/readCartIdCookie'
import type { CartActionsResult, CartCommand } from 'types/cart'
import { getStorefrontBuyerContext } from '@/api/shopify/storefront/getStorefrontBuyerContext'

export async function runCartCommand(
  command: CartCommand,
  invalidateCart: (cartId: string) => void = invalidateCartCache
): Promise<CartActionsResult> {
  await validateCartCommand(command)

  const existingCartId = await readCartIdCookie()
  const context = await getStorefrontBuyerContext()
  const rawCart = await performCartCommand(
    command,
    existingCartId,
    context
  )

  await setCartIdInCookie(rawCart.id)

  invalidateCart(rawCart.id)

  return {
    success: true,
    message: getCartCommandSuccessMessage(command),
    cart: normalizeCart(rawCart)
  }
}
