import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useCartId } from '@/hooks/useCartId'
import {
  getCachedCart,
  type CachedCartReadResult
} from '@/lib/actions/getCachedCart'
import { CartIdentityActionsContext } from '@/lib/context/CartIdentityActionsContext'
import { cartQueryPolicy } from '@/lib/cart/cartQueryPolicy'
import type { Cart } from 'types/cart'

class CartIdentityChangedError extends Error {
  constructor() {
    super(
      'Cart identity changed; retrying with authoritative identity.'
    )
    this.name = 'CartIdentityChangedError'
  }
}

export const useCartQuery = <TData = Cart | null>(
  select?: (cart: Cart | null) => TData
) => {
  const cartId = useCartId()
  const { adoptCartIdentity } = useContext(
    CartIdentityActionsContext
  )

  return useQuery<Cart | null, Error, TData>({
    queryKey: ['cart', cartId] as const,
    queryFn: async () => {
      if (!cartId) return null

      const result: CachedCartReadResult =
        await getCachedCart(cartId)

      if (result.status === 'identity-changed') {
        adoptCartIdentity(result.cartId, null)
        throw new CartIdentityChangedError()
      }

      return result.cart
    },
    enabled: !!cartId,
    ...(select ? { select } : {}),
    retry: (failureCount, error) =>
      !(error instanceof CartIdentityChangedError) &&
      failureCount < 3,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    ...cartQueryPolicy
  })
}
