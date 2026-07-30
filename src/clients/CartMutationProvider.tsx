// Path: src/clients/CartMutationProvider.tsx
'use client'

import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { createCartMutationMachine } from '@/lib/state/createCartMutationMachine'
import type { Cart, CartActions } from 'types/cart'
import * as React from 'react'

export function CartMutationProvider({
  actions,
  children,
  adoptCartIdentity
}: {
  actions: CartActions
  children: React.ReactNode
  adoptCartIdentity: (
    cartId: string | null,
    cart: Cart | null
  ) => void
}) {
  const cartMutationMachine = createCartMutationMachine(
    actions,
    newCart => adoptCartIdentity(newCart.id, newCart)
  )

  return (
    <CartMutationContext.Provider logic={cartMutationMachine}>
      {children}
    </CartMutationContext.Provider>
  )
}
