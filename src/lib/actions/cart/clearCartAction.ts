'use server'

import { executeCartCommand } from '@/lib/actions/cart/executeCartCommand'
import type { CartActionsResult } from 'types/cart'

export async function clearCartAction(): Promise<CartActionsResult> {
  return executeCartCommand({ type: 'clear' })
}
