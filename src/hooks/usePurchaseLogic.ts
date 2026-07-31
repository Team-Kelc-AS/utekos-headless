import { useContext, useEffect, useState, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CartMutationContext } from '@/lib/context/CartMutationContext'
import { CartIdContext } from '@/lib/context/CartIdContext'
import { cartStore } from '@/lib/state/cartStore'
import { useCartMutations } from '@/hooks/useCartMutations'
import { useOptimisticCartUpdate } from '@/hooks/useOptimisticCartUpdate'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import { getVariants } from '@/app/skreddersy-varmen/utekos-orginal/utils/getVariants'
import { getSelectableSizes, PRODUCT_VARIANTS } from '@/api/constants'
import type { ModelKey } from '@/api/constants'
import type { ColorVariant } from 'types/product/ProductTypes'
import type { UsePurchaseLogicProps } from 'types/product/PageProps'
import type { ShopifyProduct, ShopifyProductVariant } from 'types/product'
import type { Cart } from 'types/cart'
import type { OptimisticItemInput } from '@/hooks/useOptimisticCartUpdate'
import { reportCanonicalAddToCart } from '@/lib/analytics/addToCartReporter'
import { reportCanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutReporter'

type ConfiguredSelectionCartResult = {
  cart: Cart | null
  cartId: string | null
  product: ShopifyProduct
  selectedVariant: ShopifyProductVariant
}

function normalizeSelectedSize(size: string, selectableSizes: readonly string[]): string {
  return selectableSizes.includes(size) ? size : (selectableSizes[0] ?? size)
}

export function usePurchaseLogic({ products }: UsePurchaseLogicProps) {
  const [selectedModel, setSelectedModel] = useState<ModelKey>('utekos-techdown')
  const [quantity, setQuantity] = useState(1)
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('Middels')
  const [isTransitioning, startTransition] = useTransition()
  const [isCheckoutRedirecting, setIsCheckoutRedirecting] = useState(false)

  const { addLines } = useCartMutations()
  const { updateCartCache } = useOptimisticCartUpdate()
  const queryClient = useQueryClient()
  const contextCartId = useContext(CartIdContext)

  const isPendingFromMachine = CartMutationContext.useSelector(state => state.matches('mutating'))

  const currentConfig = PRODUCT_VARIANTS[selectedModel]
  const currentShopifyProduct = products[currentConfig.id]

  const selectableSizes = getSelectableSizes(selectedModel, currentConfig)

  const effectiveSelectedSize = normalizeSelectedSize(selectedSize, selectableSizes)

  const safeColorIndex = selectedColorIndex < currentConfig.colors.length ? selectedColorIndex : 0

  const currentColor = currentConfig.colors[safeColorIndex] as ColorVariant | undefined

  useEffect(() => {
    const resetCheckoutRedirectState = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsCheckoutRedirecting(false)
      }
    }

    window.addEventListener('pageshow', resetCheckoutRedirectState)

    return () => {
      window.removeEventListener('pageshow', resetCheckoutRedirectState)
    }
  }, [])

  const handleSelectedModelChange = (model: ModelKey) => {
    const nextConfig = PRODUCT_VARIANTS[model]
    const nextSelectableSizes = getSelectableSizes(model, nextConfig)

    setSelectedModel(model)
    setSelectedSize(size => normalizeSelectedSize(size, nextSelectableSizes))
    setSelectedColorIndex(index => (index < nextConfig.colors.length ? index : 0))
  }

  const resolveSelectedVariant = () => {
    if (!currentShopifyProduct) {
      toast.error(`Fant ikke produktdata for ${currentConfig.title}.`)
      return null
    }

    if (!currentColor) {
      toast.error(`Fant ikke fargevalg for ${currentConfig.title}.`)
      return null
    }

    const variants = getVariants(currentShopifyProduct)
    const selectedVariant = variants.find((variant: ShopifyProductVariant) => {
      const hasSize = variant.selectedOptions.some(
        option => option.value.toLowerCase() === effectiveSelectedSize.toLowerCase()
      )

      const hasColor = variant.selectedOptions.some(
        option => option.value.toLowerCase() === currentColor.name.toLowerCase()
      )

      return hasSize && hasColor
    })

    if (!selectedVariant) {
      toast.error(`Fant ikke variant for ${currentColor.name} / ${effectiveSelectedSize}.`)
      return null
    }

    if (!selectedVariant.availableForSale) {
      toast.error('Denne varianten er dessverre utsolgt for øyeblikket.')
      return null
    }

    return {
      product: currentShopifyProduct,
      selectedVariant
    }
  }

  const addConfiguredSelectionToCart = async ({
    openCart
  }: {
    openCart: boolean
  }): Promise<ConfiguredSelectionCartResult | null> => {
    const resolvedVariant = resolveSelectedVariant()

    if (!resolvedVariant) {
      return null
    }

    const { product, selectedVariant } = resolvedVariant

    if (openCart) {
      cartStore.send({ type: 'OPEN' })
    }

    try {
      let currentCartId = contextCartId || (await getCartIdFromCookie())

      const itemsToUpdate: OptimisticItemInput[] = [
        {
          product,
          variant: selectedVariant,
          quantity
        }
      ]

      if (currentCartId) {
        await updateCartCache({
          cartId: currentCartId,
          items: itemsToUpdate
        })
      }

      const linesToProcess = [{ variantId: selectedVariant.id, quantity }]
      const mutationResult = await addLines(linesToProcess)

      if (!mutationResult.success) {
        const message =
          mutationResult.message || mutationResult.error || 'Kunne ikke legge varen i handlekurven.'

        toast.error(message)

        if (currentCartId) {
          queryClient.invalidateQueries({ queryKey: ['cart', currentCartId] })
        }

        return null
      }

      const cart = mutationResult.cart ?? null

      if (cart?.id) {
        currentCartId = cart.id
        queryClient.setQueryData(['cart', cart.id], cart)
      }

      if (!currentCartId) {
        currentCartId = cart?.id ?? (await getCartIdFromCookie())
      }

      if (currentCartId) {
        reportCanonicalAddToCart({
          cartId: currentCartId,
          product,
          quantity,
          variant: selectedVariant
        })
      }

      return {
        cart,
        cartId: currentCartId ?? null,
        product,
        selectedVariant
      }
    } catch (error) {
      console.error('Feil under kjøp:', error)
      toast.error('Kunne ikke legge varen i handlekurven.')

      const cartId = contextCartId || (await getCartIdFromCookie())
      if (cartId) {
        queryClient.invalidateQueries({ queryKey: ['cart', cartId] })
      }

      return null
    }
  }

  const handleAddToCart = () => {
    startTransition(() => {
      void addConfiguredSelectionToCart({ openCart: true })
    })
  }

  const handleGoToCheckout = async () => {
    if (isCheckoutRedirecting || isPendingFromMachine) {
      return
    }

    setIsCheckoutRedirecting(true)

    const result = await addConfiguredSelectionToCart({ openCart: false })
    const checkoutUrl = result?.cart?.checkoutUrl

    if (!checkoutUrl) {
      setIsCheckoutRedirecting(false)
      toast.error('Kunne ikke åpne kassen. Prøv igjen.')
      return
    }

    if (result.cart) {
      await reportCanonicalBeginCheckout({ cart: result.cart })
    }

    window.location.assign(checkoutUrl)
  }

  return {
    selectedModel,
    setSelectedModel: handleSelectedModelChange,
    quantity,
    setQuantity,
    selectedColorIndex: safeColorIndex,
    setSelectedColorIndex,
    selectedSize: effectiveSelectedSize,
    setSelectedSize,
    handleAddToCart,
    handleGoToCheckout,
    isPending: isTransitioning || isPendingFromMachine || isCheckoutRedirecting,
    currentConfig,
    currentColor: currentColor as ColorVariant
  }
}
