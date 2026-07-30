// Path: src/lib/context/CartMutationContext.ts

import { createActorContext } from '@xstate/react'
import { createCartMutationMachine } from '@/lib/state/createCartMutationMachine'
import type { CartActions } from 'types/cart'
export type CartMutationMachine = ReturnType<
  typeof createCartMutationMachine
>

export const dummyServerActions: CartActions = {
  addCartLine: async () => {
    throw new Error(
      'CartMutationContext: "addCartLine" server action was not provided.'
    )
  },
  updateCartLineQuantity: async () => {
    throw new Error(
      'CartMutationContext: "updateCartLineQuantity" server action was not provided.'
    )
  },
  removeCartLine: async () => {
    throw new Error(
      'CartMutationContext: "removeCartLine" server action was not provided.'
    )
  },
  clearCart: async () => {
    throw new Error(
      'CartMutationContext: "clearCart" server action was not provided.'
    )
  }
}

export const CartMutationContext =
  createActorContext<CartMutationMachine>(
    createCartMutationMachine(dummyServerActions, () => {
      // Runtime provider adopts successful cart mutations.
    })
  )
