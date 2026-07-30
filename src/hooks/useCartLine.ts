// Path: src/hooks/useCartLine.ts
'use client'

import { useCartQuery } from '@/hooks/useCartQuery'
import type { Cart, CartLine } from 'types/cart'

export const useCartLine = (
  lineId: string
): CartLine | undefined => {
  const selectLineById = (
    cart: Cart | null
  ): CartLine | undefined =>
    cart?.lines?.find(line => line.id === lineId)

  const { data: line } = useCartQuery(selectLineById)

  return line
}
