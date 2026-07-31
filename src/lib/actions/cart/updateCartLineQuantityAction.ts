'use server'

import { executeCartCommand } from '@/lib/actions/cart/executeCartCommand'
import type {
  CartActionsResult,
  UpdateCartLineInput
} from 'types/cart'

export async function updateCartLineQuantityAction(
  input: UpdateCartLineInput
): Promise<CartActionsResult> {
  return executeCartCommand({ type: 'update-line', input })
}
