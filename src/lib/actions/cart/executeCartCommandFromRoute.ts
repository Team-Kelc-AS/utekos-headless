import { invalidateCartCacheFromRoute } from '@/lib/actions/cart/invalidateCartCacheFromRoute'
import { runCartCommand } from '@/lib/actions/cart/runCartCommand'
import { mapThrownErrorToActionResult } from '@/lib/errors/mapThrownErrorToActionResult'
import type { CartActionsResult, CartCommand } from 'types/cart'
import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'

export async function executeCartCommandFromRoute(
  command: CartCommand
): Promise<CartActionsResult> {
  try {
    return await runCartCommand(
      command,
      invalidateCartCacheFromRoute
    )
  } catch (error) {
    console.error(
      `Cart route command ${command.type} failed.`,
      getRedactedErrorSummary(error)
    )
    return mapThrownErrorToActionResult(error)
  }
}
