'use client'

import { useContext } from 'react'
import { toast } from 'sonner'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { cartStore } from '@/lib/state/cartStore'
import { getCartIdFromCookie } from '@/lib/actions/getCartIdFromCookie'
import { useCartMutations } from '@/hooks/useCartMutations'
import { addProductLineAndReportAddToCart } from '@/lib/analytics/addProductLineAndReportAddToCart'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

export type CanonicalAddToCartParams = {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  quantity: number
  openCart: boolean
}

export function useCanonicalAddToCart() {
  const { addLines } = useCartMutations()
  const contextCartId = useContext(CartIdContext)
  const isPending = CartMutationContext.useSelector(state =>
    state.matches('mutating')
  )

  const addToCart = async ({
    product,
    variant,
    quantity,
    openCart
  }: CanonicalAddToCartParams): Promise<{ success: boolean }> => {
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
      toast.error(result.message)
      return { success: false }
    }

    if (openCart) {
      cartStore.send({ type: 'OPEN' })
    }

    return { success: true }
  }

  return {
    addToCart,
    isPending
  }
}
