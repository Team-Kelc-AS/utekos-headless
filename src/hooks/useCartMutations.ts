// Path: src/hooks/useCartMutations.ts
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { createMutationPromise } from '@/lib/utils/createMutationPromise'
import type { AddCartLineInput, CartActionsResult } from 'types/cart'

type AddLinesPayload =
  | AddCartLineInput[]
  | { lines: AddCartLineInput[]; discountCode?: string }

export function useCartMutations() {
  const actor = CartMutationContext.useActorRef()

  const addLines = async (payload: AddLinesPayload): Promise<CartActionsResult> => {
    const snapshot = await createMutationPromise({ type: 'ADD_LINES', input: payload }, actor)

    const result = snapshot.context.lastResult

    if (result) {
      return result
    }

    const message = snapshot.context.error ?? 'Kunne ikke oppdatere handlekurven.'

    return {
      success: false,
      message,
      error: message,
      cart: null
    }
  }

  return {
    addLines
  }
}
