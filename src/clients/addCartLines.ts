import { addCartLinesRequestSchema } from '@/lib/cart/addCartLinesRequestSchema'
import { cartActionsResultSchema } from '@/lib/cart/cartActionsResultSchema'
import type { AddCartLineInput, CartActionsResult } from 'types/cart'

export async function addCartLines(
  lines: AddCartLineInput[],
  discountCode?: string
): Promise<CartActionsResult> {
  const body = addCartLinesRequestSchema.parse({
    lines,
    ...(discountCode ? { discountCode } : {})
  })
  const response = await fetch('/api/cart/lines', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })
  const result = cartActionsResultSchema.parse(await response.json())

  return result as CartActionsResult
}
