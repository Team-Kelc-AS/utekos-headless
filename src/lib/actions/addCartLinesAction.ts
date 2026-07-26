'use server'

import { executeCartCommand } from '@/lib/actions/cart/executeCartCommand'
import type { AddCartLineInput, CartActionsResult } from 'types/cart'

export async function addCartLinesAction(
  lines: AddCartLineInput[],
  discountCode?: string
): Promise<CartActionsResult> {
  return executeCartCommand({
    type: 'add-lines',
    lines,
    ...(discountCode ? { discountCode } : {})
  })
}
