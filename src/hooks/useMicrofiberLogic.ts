import { useState } from 'react'
import { toast } from 'sonner'
import { GID_PREFIX } from '@/api/constants'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { variantMap } from '@/app/skreddersy-varmen/utekos-orginal/utils/variantMap'
import { productConfig } from '@/app/skreddersy-varmen/utekos-orginal/utils/productConfig'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import type {
  ShopifyProduct,
  ShopifyProductVariant,
  MicrofiberColor,
  MicrofiberSize
} from 'types/product'

export function useMicrofiberLogic(product: ShopifyProduct | null) {
  const [color, setColor] = useState<MicrofiberColor>('fjellbla')
  const [size, setSize] = useState<MicrofiberSize>('large')
  const { addToCart, isPending } = useCanonicalAddToCart()

  const activeImage = productConfig.colors.find(
    c => c.id === (color as unknown)
  )?.image
  const variantIdRaw = variantMap[color]?.[size]
  const selectedVariant: ShopifyProductVariant | null =
    product && variantIdRaw ?
      product.variants.edges
        .map(edge => edge.node)
        .find(variant => variant.id === `${GID_PREFIX}${variantIdRaw}`) ?? null
    : null

  const scrollToSizeGuide = () => {
    void scrollToElement('size-guide', { offsetY: 96 })
  }

  const handleAddToCart = () => {
    if (!product) {
      toast.error(
        'Produktet er midlertidig utilgjengelig. Prøv igjen senere.'
      )
      return
    }

    if (!variantIdRaw) {
      toast.error('Kunne ikke finne varianten. Prøv en annen kombinasjon.')
      return
    }

    if (!selectedVariant) {
      toast.error('Kunne ikke finne valgt variant. Prøv igjen.')
      return
    }

    void (async () => {
      const { success } = await addToCart({
        product,
        variant: selectedVariant,
        quantity: 1,
        openCart: true
      })

      if (success) {
        toast.success('Lagt i handlekurven!')
      }
    })()
  }

  return {
    color,
    setColor,
    size,
    setSize,
    activeImage,
    product,
    selectedVariant,
    handleAddToCart,
    scrollToSizeGuide,
    isPending: isPending || !product
  }
}
