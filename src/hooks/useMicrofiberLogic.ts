import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { GID_PREFIX } from '@/api/constants'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { variantMap } from '@/app/skreddersy-varmen/utekos-orginal/utils/variantMap'
import { productConfig } from '@/app/skreddersy-varmen/utekos-orginal/utils/productConfig'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import { useAddToCartAction } from '@/hooks/useAddToCartAction'
import { reportCanonicalVariantSelect } from '@/lib/analytics/variantSelectReporter'
import { reportCanonicalViewItem } from '@/lib/analytics/viewItemReporter'
import type {
  ShopifyProduct,
  ShopifyProductVariant,
  MicrofiberColor,
  MicrofiberSize
} from 'types/product'
import type { ProductCartModel } from 'types/product/ProductPurchaseModel'

export function useMicrofiberLogic(product: ShopifyProduct | null) {
  const [color, setColor] = useState<MicrofiberColor>('fjellbla')
  const [size, setSize] = useState<MicrofiberSize>('large')
  const { addToCart, isPending } = useCanonicalAddToCart()
  const reportedVariantIdRef = useRef<string | null>(null)
  const reportedViewItemVariantIdRef = useRef<string | null>(null)

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
  const productForCartAction: ProductCartModel = product
    ? {
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        productType: product.productType,
        collections: {
          nodes: product.collections.nodes.map(node => ({
            id: node.id,
            title: node.title
          }))
        },
        featuredImage: product.featuredImage
      }
    : {
        id: '',
        title: '',
        handle: '',
        vendor: '',
        productType: '',
        collections: { nodes: [] },
        featuredImage: null
      }
  const { performGoToCheckout, isPending: isCheckoutPending } = useAddToCartAction({
    product: productForCartAction,
    selectedVariant
  })

  useEffect(() => {
    if (!product || !selectedVariant) return

    let stopVariantSelect = () => {}
    let stopViewItem = () => {}
    const currentVariantId = selectedVariant.id

    if (reportedVariantIdRef.current !== currentVariantId) {
      reportedVariantIdRef.current = currentVariantId
      stopVariantSelect = reportCanonicalVariantSelect({
        customData: {
          interaction_id: globalThis.crypto.randomUUID(),
          product_id: product.id,
          variant_id: selectedVariant.id,
          item_id: selectedVariant.id,
          item_variant: selectedVariant.title,
          availability:
            selectedVariant.availableForSale ? 'available' : 'unavailable'
        }
      })
    }

    if (reportedViewItemVariantIdRef.current !== currentVariantId) {
      reportedViewItemVariantIdRef.current = currentVariantId
      stopViewItem = reportCanonicalViewItem({
        product,
        variant: selectedVariant
      })
    }

    return () => {
      stopVariantSelect()
      stopViewItem()
    }
  }, [product, selectedVariant])

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

  const handleGoToCheckout = async () => {
    if (!product) {
      toast.error(
        'Produktet er midlertidig utilgjengelig. Prøv igjen senere.'
      )
      return
    }

    if (!selectedVariant) {
      toast.error('Kunne ikke finne valgt variant. Prøv igjen.')
      return
    }

    await performGoToCheckout(1)
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
    handleGoToCheckout,
    scrollToSizeGuide,
    isPending: isPending || isCheckoutPending || !product
  }
}
