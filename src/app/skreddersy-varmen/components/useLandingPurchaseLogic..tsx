// Path: src/app/skreddersy-varmen/components/useLandingPurchaseLogic.ts
'use client'

import { useContext, useRef, useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { cartStore } from '@/lib/state/cartStore'
import { useCartMutations } from '@/hooks/useCartMutations'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import { reportCanonicalVariantSelect } from '@/lib/analytics/variantSelectReporter'
import { getVariants } from '@/app/skreddersy-varmen/utekos-orginal/utils/getVariants'
import { getSelectableSizes, PRODUCT_VARIANTS } from '@/api/constants'
import type { ModelKey } from '@/api/constants'
import type { ColorVariant } from 'types/product/ProductTypes'
import type { ShopifyProduct, ShopifyProductVariant } from 'types/product'

type UseLandingPurchaseLogicProps = {
  products: Record<string, ShopifyProduct | null | undefined>
}

function normalizeSelectedSize(size: string, selectableSizes: readonly string[]): string {
  return selectableSizes.includes(size) ? size : (selectableSizes[0] ?? size)
}

function findLandingVariant(input: {
  product: ShopifyProduct
  colorName: string
  size: string
}): ShopifyProductVariant | null {
  return (
    getVariants(input.product).find((variant: ShopifyProductVariant) => {
      const hasSize = variant.selectedOptions.some(
        option => option.value.toLowerCase() === input.size.toLowerCase()
      )
      const hasColor = variant.selectedOptions.some(
        option => option.value.toLowerCase() === input.colorName.toLowerCase()
      )
      return hasSize && hasColor
    }) ?? null
  )
}

export function useLandingPurchaseLogic({ products }: UseLandingPurchaseLogicProps) {
  const [selectedModel, setSelectedModelState] = useState<ModelKey>('utekos-techdown')
  const [quantity, setQuantityState] = useState(1)
  const [selectedColorIndex, setSelectedColorIndexState] = useState(0)
  const [selectedSize, setSelectedSizeState] = useState('Stor')
  const [isTransitioning, startTransition] = useTransition()
  const lastReportedVariantId = useRef<string | null>(null)

  const { addLines } = useCartMutations()
  const queryClient = useQueryClient()
  const contextCartId = useContext(CartIdContext)

  const isPendingFromMachine = CartMutationContext.useSelector(state => state.matches('mutating'))

  const currentConfig = PRODUCT_VARIANTS[selectedModel]
  const currentShopifyProduct = products[currentConfig.id]

  const selectableSizes = getSelectableSizes(selectedModel, currentConfig)

  const safeSelectedSize = normalizeSelectedSize(selectedSize, selectableSizes)

  const safeColorIndex = selectedColorIndex < currentConfig.colors.length ? selectedColorIndex : 0

  const currentColor = currentConfig.colors[safeColorIndex] as ColorVariant | undefined

  const reportVariantSelect = (
    product: ShopifyProduct,
    variant: ShopifyProductVariant
  ) => {
    if (lastReportedVariantId.current === variant.id) return
    lastReportedVariantId.current = variant.id

    reportCanonicalVariantSelect({
      customData: {
        interaction_id: globalThis.crypto.randomUUID(),
        product_id: product.id,
        variant_id: variant.id,
        item_id: variant.id,
        item_variant: variant.title,
        availability:
          variant.availableForSale ? 'available' : 'unavailable'
      }
    })
  }

  const setQuantity = (nextQuantity: number) => {
    setQuantityState(Math.max(1, nextQuantity))
  }

  const setSelectedColorIndex = (index: number) => {
    const nextIndex =
      index >= 0 && index < currentConfig.colors.length ? index : 0
    setSelectedColorIndexState(nextIndex)

    const nextColor = currentConfig.colors[nextIndex] as ColorVariant | undefined
    if (!currentShopifyProduct || !nextColor) return

    const nextVariant = findLandingVariant({
      product: currentShopifyProduct,
      colorName: nextColor.name,
      size: safeSelectedSize
    })
    if (nextVariant) {
      reportVariantSelect(currentShopifyProduct, nextVariant)
    }
  }

  const setSelectedSize = (size: string) => {
    const nextSize = normalizeSelectedSize(size, selectableSizes)
    setSelectedSizeState(nextSize)

    if (!currentShopifyProduct || !currentColor) return

    const nextVariant = findLandingVariant({
      product: currentShopifyProduct,
      colorName: currentColor.name,
      size: nextSize
    })
    if (nextVariant) {
      reportVariantSelect(currentShopifyProduct, nextVariant)
    }
  }

  const setSelectedModel = (model: ModelKey) => {
    const nextConfig = PRODUCT_VARIANTS[model]
    const nextSelectableSizes = getSelectableSizes(model, nextConfig)
    const nextColorIndex =
      selectedColorIndex >= 0 && selectedColorIndex < nextConfig.colors.length
        ? selectedColorIndex
        : 0
    const nextSize = normalizeSelectedSize(selectedSize, nextSelectableSizes)
    const nextColor = nextConfig.colors[nextColorIndex] as ColorVariant | undefined
    const nextProduct = products[nextConfig.id]

    setSelectedModelState(model)
    setSelectedColorIndexState(nextColorIndex)
    setSelectedSizeState(nextSize)

    if (!nextProduct || !nextColor) return

    const nextVariant = findLandingVariant({
      product: nextProduct,
      colorName: nextColor.name,
      size: nextSize
    })
    if (nextVariant) {
      reportVariantSelect(nextProduct, nextVariant)
    }
  }

  const resolveSelectedVariant = (
    options: { silent?: boolean } = {}
  ): {
    product: ShopifyProduct
    selectedVariant: ShopifyProductVariant
  } | null => {
    const { silent = false } = options

    if (!currentShopifyProduct) {
      if (!silent) {
        toast.error(`Fant ikke produktdata for ${currentConfig.title}.`)
      }
      return null
    }

    if (!currentColor) {
      if (!silent) {
        toast.error(`Fant ikke fargevalg for ${currentConfig.title}.`)
      }
      return null
    }

    const selectedVariant = findLandingVariant({
      product: currentShopifyProduct,
      colorName: currentColor.name,
      size: safeSelectedSize
    })

    if (!selectedVariant) {
      if (!silent) {
        toast.error(`Fant ikke variant for ${currentColor.name} / ${safeSelectedSize}.`)
      }
      return null
    }

    if (!selectedVariant.availableForSale) {
      if (!silent) {
        toast.error('Denne varianten er dessverre utsolgt for øyeblikket.')
      }
      return null
    }

    return {
      product: currentShopifyProduct,
      selectedVariant
    }
  }

  const resolvedCheckout = resolveSelectedVariant({ silent: true })

  const handleAddToCart = () => {
    if (isPendingFromMachine || isTransitioning) {
      return
    }

    startTransition(async () => {
      const resolvedVariant = resolveSelectedVariant({ silent: false })

      if (!resolvedVariant) {
        return
      }

      const { product, selectedVariant } = resolvedVariant
      let cartId = contextCartId || (await getCartIdFromCookie())

      try {
        cartStore.send({ type: 'OPEN' })

        const mutationResult = await addLines([
          {
            variantId: selectedVariant.id,
            quantity
          }
        ])

        if (!mutationResult.success) {
          const message =
            mutationResult.message || mutationResult.error || 'Kunne ikke legge varen i handlekurven.'

          toast.error(message)

          if (cartId) {
            queryClient.invalidateQueries({ queryKey: ['cart', cartId] })
          }

          return
        }

        const cart = mutationResult.cart ?? null

        if (cart?.id) {
          cartId = cart.id
          queryClient.setQueryData(['cart', cart.id], cart)
        }

        if (cartId && selectedVariant) {
          reportCanonicalAddToCart({
            cartId,
            product,
            quantity,
            variant: selectedVariant
          })
        }
      } catch (error) {
        console.error('Kunne ikke legge til vare:', error)
        toast.error('Kunne ikke legge varen i handlekurven.')

        if (cartId) {
          queryClient.invalidateQueries({ queryKey: ['cart', cartId] })
        }
      }
    })
  }

  return {
    selectedModel,
    setSelectedModel,
    quantity,
    setQuantity,
    selectedColorIndex: safeColorIndex,
    setSelectedColorIndex,
    selectedSize: safeSelectedSize,
    setSelectedSize,
    selectableSizes,
    handleAddToCart,
    isPending: isTransitioning || isPendingFromMachine,
    isAddToCartPending: isTransitioning,
    currentConfig,
    currentColor,
    shopifyProduct: resolvedCheckout?.product ?? null,
    selectedShopifyVariant: resolvedCheckout?.selectedVariant ?? null
  }
}
