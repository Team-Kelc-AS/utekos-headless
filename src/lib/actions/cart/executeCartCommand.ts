'use server'

import { runCartCommand } from '@/lib/actions/cart/runCartCommand'
import { mapThrownErrorToActionResult } from '@/lib/errors/mapThrownErrorToActionResult'
import type { CartActionsResult, CartCommand } from 'types/cart'
import { getRedactedErrorSummary } from '@/lib/cart/getRedactedErrorSummary'

export async function executeCartCommand(
  command: CartCommand
): Promise<CartActionsResult> {
  try {
    return await runCartCommand(command)
  } catch (error) {
    console.error(
      `Cart command ${command.type} failed.`,
      getRedactedErrorSummary(error)
    )
    return mapThrownErrorToActionResult(error)
  }
}
