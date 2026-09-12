'use client'

import {
  useContext,
  useRef,
  useState,
  useTransition
} from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { cartStore } from '@/lib/state/cartStore'
import { useCartMutations } from '@/hooks/useCartMutations'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import { loadAddToCartReporter } from '@/lib/analytics/loadAddToCartReporter'
import { loadVariantSelectReporter } from '@/lib/analytics/loadVariantSelectReporter'
import { buildPublicVariantUrl } from '@/lib/products/presentation/buildPublicVariantUrl'
import type { ProductPresentation } from '@/lib/products/presentation/getProductPresentation'
import type { ProductModel } from '@/lib/products/commerce'
import { resolveCommerceVariantFromSearchParams } from '@/lib/products/commerce/resolveCommerceVariantFromSearchParams'

type UseLandingPurchaseLogicProps = {
  commerce: ProductModel
  initialVariantId: string
  presentation: ProductPresentation
}

export function useLandingPurchaseLogic({
  commerce,
  initialVariantId,
  presentation
}: UseLandingPurchaseLogicProps) {
  const searchParams = useSearchParams()
  const [quantity, setQuantityState] = useState(1)
  const [isTransitioning, startTransition] = useTransition()
  const lastReportedVariantId = useRef<string | null>(null)

  const { addLines } = useCartMutations()
  const queryClient = useQueryClient()
  const contextCartId = useContext(CartIdContext)
  const isPendingFromMachine = CartMutationContext.useSelector(
    state => state.matches('mutating')
  )
  const selectedVariant = resolveCommerceVariantFromSearchParams(
    commerce,
    searchParams ?? { variant: initialVariantId }
  )
  const selectedShopifyVariant = selectedVariant ?? null

  const reportVariantSelect = (
    variant: ProductModel['variants'][number]
  ) => {
    if (lastReportedVariantId.current === variant.id) {
      return
    }

    lastReportedVariantId.current = variant.id
    void loadVariantSelectReporter().then(
      ({ reportCanonicalVariantSelect }) => {
        reportCanonicalVariantSelect({
          customData: {
            interaction_id: globalThis.crypto.randomUUID(),
            product_id: commerce.id,
            variant_id: variant.id,
            item_id: variant.id,
            item_variant: variant.title,
            availability:
              variant.availableForSale ? 'available' : (
                'unavailable'
              )
          }
        })
      }
    )
  }

  const setQuantity = (nextQuantity: number) => {
    setQuantityState(Math.max(1, nextQuantity))
  }

  const setSelectedSize = (size: string) => {
    const nextVariant = commerce.variants.find(
      variant => variant.options.size === size
    )

    if (!nextVariant) return

    const nextUrl = buildPublicVariantUrl({
      presentation,
      options: nextVariant.options,
      searchParams: window.location.search,
      path: '/skreddersy-varmen'
    })

    window.history.replaceState(
      null,
      '',
      `${nextUrl}${window.location.hash}`
    )
    reportVariantSelect(nextVariant)
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
          { variantId: selectedShopifyVariant.id, quantity }
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
          const reportedCartId = cartId
          void loadAddToCartReporter().then(
            ({ reportCanonicalAddToCart }) => {
              reportCanonicalAddToCart({
                cartId: reportedCartId,
                product: commerce,
                quantity,
                variant: selectedShopifyVariant
              })
            }
          )
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
      label: variant.options.size ?? variant.title,
      availableForSale: variant.availableForSale
    })),
    handleAddToCart,
    isPending: isTransitioning || isPendingFromMachine,
    isAddToCartPending: isTransitioning,
    commerce,
    shopifyProduct: commerce,
    selectedShopifyVariant
  }
}
