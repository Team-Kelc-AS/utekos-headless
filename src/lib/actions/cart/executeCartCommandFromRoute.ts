import { invalidateCartCacheFromRoute } from '@/lib/actions/cart/invalidateCartCacheFromRoute'
import { runCartCommand } from '@/lib/actions/cart/runCartCommand'
import { mapThrownErrorToActionResult } from '@/lib/errors/mapThrownErrorToActionResult'
import type { CartActionsResult, CartCommand } from 'types/cart'
import { logCartError } from '@/lib/cart/logCartError'

export async function executeCartCommandFromRoute(
  command: CartCommand
): Promise<CartActionsResult> {
  try {
    return await runCartCommand(
      command,
      invalidateCartCacheFromRoute
    )
  } catch (error) {
    logCartError(`Cart route command ${command.type} failed.`, error)
    return mapThrownErrorToActionResult(error)
  }
}
