'use client'

import { useContext, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { cartStore } from '@/lib/state/cartStore'
import { useCartMutations } from '@/hooks/useCartMutations'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import { reportCanonicalVariantSelect } from '@/lib/analytics/variantSelectReporter'
import {
  buildPublicVariantUrl,
  requireProductPresentation
} from '@/lib/products/presentation'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'
import { toPurchaseVariantFromPublicCommerce } from '@/lib/products/commerce/toPurchaseVariantFromPublicCommerce'
import type { Route } from 'next'

type UseLandingPurchaseLogicProps = {
  commerce: ProductCommerceViewModel
  initialVariantId: string
}

export function useLandingPurchaseLogic({
  commerce,
  initialVariantId
}: UseLandingPurchaseLogicProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presentation = requireProductPresentation(
    commerce.publicHandle
  )
  const validInitialVariant = commerce.variants.find(
    variant => variant.commerce.id === initialVariantId
  )
  const [selectedVariantId, setSelectedVariantId] = useState(
    validInitialVariant?.commerce.id ?? commerce.defaultVariantId
  )
  const [quantity, setQuantityState] = useState(1)
  const [isTransitioning, startTransition] = useTransition()
  const lastReportedVariantId = useRef<string | null>(null)

  const { addLines } = useCartMutations()
  const queryClient = useQueryClient()
  const contextCartId = useContext(CartIdContext)
  const isPendingFromMachine = CartMutationContext.useSelector(
    state => state.matches('mutating')
  )
  const selectedVariant =
    commerce.variants.find(
      variant => variant.commerce.id === selectedVariantId
    ) ?? commerce.variants[0]
  const selectedShopifyVariant =
    selectedVariant ?
      toPurchaseVariantFromPublicCommerce(selectedVariant)
    : null

  const reportVariantSelect = (
    variant: ProductCommerceViewModel['variants'][number]
  ) => {
    if (lastReportedVariantId.current === variant.commerce.id) {
      return
    }

    lastReportedVariantId.current = variant.commerce.id
    reportCanonicalVariantSelect({
      customData: {
        interaction_id: globalThis.crypto.randomUUID(),
        product_id: commerce.product.id,
        variant_id: variant.commerce.id,
        item_id: variant.commerce.id,
        item_variant: variant.publicName,
        availability:
          variant.commerce.availableForSale ?
            'available'
          : 'unavailable'
      }
    })
  }

  const setQuantity = (nextQuantity: number) => {
    setQuantityState(Math.max(1, nextQuantity))
  }

  const setSelectedSize = (size: string) => {
    const nextVariant = commerce.variants.find(
      variant => variant.options.size === size
    )

    if (!nextVariant) return

    setSelectedVariantId(nextVariant.commerce.id)
    reportVariantSelect(nextVariant)

    const nextUrl = buildPublicVariantUrl({
      presentation,
      options: nextVariant.options,
      searchParams,
      path: '/skreddersy-varmen'
    })

    router.replace(nextUrl as Route, { scroll: false })
  }

  const handleAddToCart = () => {
    if (
      isPendingFromMachine ||
      isTransitioning ||
      !selectedShopifyVariant?.availableForSale
    ) {
      if (!selectedShopifyVariant?.availableForSale) {
        toast.error(
          'Denne størrelsen er dessverre utsolgt for øyeblikket.'
        )
      }
      return
    }

    startTransition(async () => {
      let cartId = contextCartId

      try {
        cartId ||= await getCartIdFromCookie()
        cartStore.send({ type: 'OPEN' })

        const mutationResult = await addLines([
          {
            variantId: selectedShopifyVariant.id,
            quantity
          }
        ])

        if (!mutationResult.success) {
          const message =
            mutationResult.message ||
            mutationResult.error ||
            'Kunne ikke legge varen i handlekurven.'

          toast.error(message)

          if (cartId) {
            queryClient.invalidateQueries({
              queryKey: ['cart', cartId]
            })
          }

          return
        }

        const cart = mutationResult.cart ?? null

        if (cart?.id) {
          cartId = cart.id
          queryClient.setQueryData(['cart', cart.id], cart)
        }

        if (cartId) {
          reportCanonicalAddToCart({
            cartId,
            product: commerce.product,
            quantity,
            variant: selectedShopifyVariant
          })
        }
      } catch (error) {
        console.error('Kunne ikke legge til vare:', error)
        toast.error('Kunne ikke legge varen i handlekurven.')

        if (cartId) {
          queryClient.invalidateQueries({
            queryKey: ['cart', cartId]
          })
        }
      }
    })
  }

  return {
    quantity,
    setQuantity,
    selectedSize: selectedVariant?.options.size ?? '',
    setSelectedSize,
    sizeOptions: commerce.variants.map(variant => ({
      label: variant.options.size ?? variant.publicName,
      availableForSale: variant.commerce.availableForSale
    })),
    handleAddToCart,
    isPending: isTransitioning || isPendingFromMachine,
    isAddToCartPending: isTransitioning,
    commerce,
    shopifyProduct: commerce.product,
    selectedShopifyVariant
  }
}
