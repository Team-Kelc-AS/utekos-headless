'use server'

import { executeCartCommand } from '@/lib/actions/cart/executeCartCommand'
import type { CartActionsResult, RemoveCartLineInput } from 'types/cart'

export async function removeCartLineAction(
  input: RemoveCartLineInput
): Promise<CartActionsResult> {
  return executeCartCommand({ type: 'remove-line', input })
}
