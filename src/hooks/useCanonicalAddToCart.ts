'use client'

import { useContext, useState } from 'react'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { cartStore } from '@/lib/state/cartStore'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import { useCartMutations } from '@/hooks/useCartMutations'
import { addProductLineAndReportAddToCart } from '@/lib/analytics/addProductLineAndReportAddToCart'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

function showAddToCartError(message: string) {
  void import('sonner')
    .then(({ toast }) => {
      toast.error(message)
    })
    .catch(() => {})
}

export type CanonicalAddToCartParams = {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  quantity: number
  openCart: boolean
}

export function useCanonicalAddToCart() {
  const { addLines } = useCartMutations()
  const contextCartId = useContext(CartIdContext)
  const [isPending, setIsPending] = useState(false)
  const isCartBusy = CartMutationContext.useSelector(state =>
    state.matches('mutating')
  )

  const addToCart = async ({
    product,
    variant,
    quantity,
    openCart
  }: CanonicalAddToCartParams): Promise<{ success: boolean }> => {
    if (isPending || isCartBusy) {
      return { success: false }
    }

    setIsPending(true)

    if (openCart) {
      cartStore.send({ type: 'OPEN' })
    }

    try {
      const result = await addProductLineAndReportAddToCart({
        product,
        variant,
        quantity,
        contextCartId,
        addLines,
        getCartIdFromCookie,
        report: reportCanonicalAddToCart
      })

      if (!result.success) {
        showAddToCartError(result.message)
        return { success: false }
      }

      return { success: true }
    } finally {
      setIsPending(false)
    }
  }

  return {
    addToCart,
    isPending,
    isCartBusy
  }
}
