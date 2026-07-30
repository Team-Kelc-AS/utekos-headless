// Path: src/hooks/useCartLines.ts
import { useCartQuery } from '@/hooks/useCartQuery'
import type { Cart } from 'types/cart'

const selectLineIds = (cart: Cart | null) =>
  cart?.lines?.map(line => line.id) ?? []
export const useCartLineIds = () => {
  return useCartQuery(selectLineIds)
}
