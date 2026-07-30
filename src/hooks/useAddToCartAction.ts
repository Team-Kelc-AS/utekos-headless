'use client'

import { useContext, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { cartStore } from '@/lib/state/cartStore'
import { useCartMutations } from '@/hooks/useCartMutations'
import {
  useOptimisticCartUpdate,
  type OptimisticItemInput
} from '@/hooks/useOptimisticCartUpdate'
import { handlePostAddToCartCampaigns } from '@/lib/campaigns/cart/handlePostAddToCartCampaigns'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import { reportCanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutReporter'
import type { UseAddToCartActionProps, Cart } from 'types/cart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

interface ExtendedAddToCartProps extends UseAddToCartActionProps {
  additionalProductData?:
    | {
        product: ProductCartModel
        variant: ProductPurchaseVariant
      }
    | undefined
}

export function useAddToCartAction({
  product,
  selectedVariant,
  additionalLine,
  additionalProductData
}: ExtendedAddToCartProps) {
  const [pendingAction, setPendingAction] = useState<'add' | 'checkout' | null>(null)
  const { addLines } = useCartMutations()
  const { updateCartCache } = useOptimisticCartUpdate()
  const queryClient = useQueryClient()
  const contextCartId = useContext(CartIdContext)

  const isPendingFromMachine = CartMutationContext.useSelector(state =>
    state.matches('mutating')
  )

  const addSelectedLinesToCart = async ({
    quantity,
    openCart
  }: {
    quantity: number
    openCart: boolean
  }) => {
    if (!selectedVariant) {
      toast.error('Vennligst velg en variant før du legger i handlekurven.')
      return null
    }

    if (openCart) {
      cartStore.send({ type: 'OPEN' })
    }

    try {
      let cartId = contextCartId

      if (cartId) {
        const itemsToUpdate: OptimisticItemInput[] = []
        itemsToUpdate.push({
          product,
          variant: selectedVariant,
          quantity
        })

        if (additionalLine && additionalProductData) {
          itemsToUpdate.push({
            product: additionalProductData.product,
            variant: additionalProductData.variant,
            quantity: additionalLine.quantity,
            customPrice: 0
          })
        }
        await updateCartCache({ cartId, items: itemsToUpdate })
      }

      const lines = [{ variantId: selectedVariant.id, quantity }]
      if (additionalLine) {
        lines.push({
          variantId: additionalLine.variantId,
          quantity: additionalLine.quantity
        })
      }

      const mutationPayload = additionalLine ? { lines, discountCode: 'GRATISBUFF' } : lines

      const mutationResult = await addLines(mutationPayload)

      if (!mutationResult.success) {
        const message = mutationResult.message || mutationResult.error || 'Kunne ikke legge varen i handlekurven.'
        toast.error(message)

        if (cartId) {
          queryClient.invalidateQueries({ queryKey: ['cart', cartId] })
        }

        return null
      }

      const resultCart = mutationResult.cart ?? null

      if (resultCart?.id) {
        cartId = resultCart.id
        queryClient.setQueryData(['cart', resultCart.id], resultCart)
      }

      if (cartId && selectedVariant) {
        reportCanonicalAddToCart({
          cartId,
          product,
          quantity,
          variant: selectedVariant
        })
      }

      if (cartId && additionalLine) {
        const freshCart = queryClient.getQueryData<Cart>(['cart', cartId])

        if (freshCart) {
          let needsFix = false
          const fixedLines = freshCart.lines.map(line => {
            if (line.merchandise.id === additionalLine.variantId) {
              if (parseFloat(line.cost.totalAmount.amount) > 0) {
                needsFix = true
                return {
                  ...line,
                  cost: {
                    ...line.cost,
                    totalAmount: { ...line.cost.totalAmount, amount: '0.0' }
                  }
                }
              }
            }
            return line
          })

          if (needsFix) {
            queryClient.setQueryData(['cart', cartId], {
              ...freshCart,
              lines: fixedLines
            })
          }
        }

        handlePostAddToCartCampaigns({
          cartId,
          additionalLine,
          queryClient
        }).catch(console.error)
      }

      return {
        cart: resultCart,
        cartId,
        selectedVariant
      }
    } catch (mutationError) {
      console.error('Feil under legg-i-kurv operasjon:', mutationError)
      toast.error('Kunne ikke legge varen(e) i handlekurven. Prøv igjen.')

      const cartId = contextCartId
      if (cartId) {
        queryClient.invalidateQueries({ queryKey: ['cart', cartId] })
      }

      return null
    }
  }

  const performAddToCart = async (quantity: number) => {
    if (pendingAction || isPendingFromMachine) return

    setPendingAction('add')

    try {
      await addSelectedLinesToCart({ quantity, openCart: true })
    } finally {
      setPendingAction(null)
    }
  }

  const performGoToCheckout = async (quantity: number) => {
    if (pendingAction || isPendingFromMachine) return

    setPendingAction('checkout')

    try {
      const result = await addSelectedLinesToCart({ quantity, openCart: false })
      const checkoutUrl = result?.cart?.checkoutUrl

      if (!checkoutUrl) {
        setPendingAction(null)
        toast.error('Kunne ikke åpne kassen. Prøv igjen.')
        return
      }

      if (result.cart) {
        await reportCanonicalBeginCheckout({ cart: result.cart })
      }

      window.location.assign(checkoutUrl)
    } catch {
      setPendingAction(null)
      toast.error('Kunne ikke åpne kassen. Prøv igjen.')
    }
  }

  const isPending = pendingAction !== null || isPendingFromMachine

  return {
    performAddToCart,
    performGoToCheckout,
    isPending,
    isAddToCartPending: pendingAction === 'add',
    isCheckoutPending: pendingAction === 'checkout'
  }
}
