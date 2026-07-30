'use client'

import { createContext } from 'react'

import type { Cart } from 'types/cart'

export type CartIdentityActions = {
  adoptCartIdentity: (
    cartId: string | null,
    cart: Cart | null
  ) => void
}

export const CartIdentityActionsContext =
  createContext<CartIdentityActions>({
    adoptCartIdentity: () => {}
  })
