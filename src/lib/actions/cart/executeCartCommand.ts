'use server'

import { runCartCommand } from '@/lib/actions/cart/runCartCommand'
import { mapThrownErrorToActionResult } from '@/lib/errors/mapThrownErrorToActionResult'
import type { CartActionsResult, CartCommand } from 'types/cart'
import { logCartError } from '@/lib/cart/logCartError'

export async function executeCartCommand(
  command: CartCommand
): Promise<CartActionsResult> {
  try {
    return await runCartCommand(command)
  } catch (error) {
    logCartError(`Cart command ${command.type} failed.`, error)
    return mapThrownErrorToActionResult(error)
  }
}
