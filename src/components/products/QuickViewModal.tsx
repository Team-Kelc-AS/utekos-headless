'use client'

import { AddToCart } from '@/components/cart/AddToCart'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

import { useLocalVariantSelection } from '@/hooks/useLocalVariantSelection'
import { reportCanonicalOpenQuickView } from '@/lib/analytics/openQuickViewReporter'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import { mapShopifyViewItem } from '@/lib/analytics/shopifyViewItemCommerce'
import {
  advanceQuickViewReportingState,
  initialQuickViewReportingState
} from '@/lib/analytics/quickViewReportingState'
import type { ShopifyProduct } from 'types/product'
import Image from 'next/image'
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from 'react'
import { toast } from 'sonner'
import { VariantSelectors } from './VariantSelectors'
import { Price } from '../jsx/Price'
import { QuickViewModalSkeleton } from '../skeletons/QuickViewModalSkeleton'
import { getProductWithoutSmallSize } from './getProductWithoutSmallSize'

interface QuickViewModalProps {
  productHandle: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  sourceSurface: string
  hideDescription?: boolean
}

export function QuickViewModal({
  productHandle,
  isOpen,
  onOpenChange,
  sourceSurface,
  hideDescription = false
}: QuickViewModalProps) {
  const reportingState = useRef(initialQuickViewReportingState)
  const [productData, setProductData] =
    useState<ShopifyProduct | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const initialVariantId =
    productData?.selectedOrFirstAvailableVariant?.id ?? null
  const { selectedVariant, updateVariant } =
    useLocalVariantSelection(
      productData ?? undefined,
      initialVariantId
    )

  const handleFetchError = useEffectEvent((error: unknown) => {
    reportClientCaughtError(error, 'quick_view.product_fetch')
    toast.error(
      'Beklager, vi kunne ikke laste produktet. Vennligst prøv igjen.'
    )
    onOpenChange(false)
  })

  useEffect(() => {
    if (!isOpen) return

    const controller = new AbortController()

    async function fetchMainProduct() {
      setIsLoading(true)
      setProductData(null)

      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(productHandle)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Quick view request failed: ${response.status}`)
        }

        const mainProduct = (await response.json()) as ShopifyProduct
        if (!controller.signal.aborted) {
          setProductData(getProductWithoutSmallSize(mainProduct))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          handleFetchError(error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchMainProduct()

    return () => controller.abort()
  }, [isOpen, productHandle])

  const featuredImage =
    selectedVariant?.image ?? productData?.featuredImage

  useEffect(() => {
    const transition = advanceQuickViewReportingState(
      reportingState.current,
      {
        isOpen,
        isResolved: Boolean(productData && selectedVariant)
      }
    )
    reportingState.current = transition.nextState

    if (
      transition.reportSequence === null ||
      !productData ||
      !selectedVariant
    ) return

    const commerce = mapShopifyViewItem({
      product: productData,
      variant: selectedVariant
    })
    reportCanonicalOpenQuickView({
      ...commerce,
      open_sequence: transition.reportSequence,
      source_surface: sourceSurface
    })
  }, [isOpen, productData, selectedVariant, sourceSurface])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100svh-2rem)] overflow-y-auto bg-popover text-popover-foreground shadow-2xl sm:max-w-4xl md:max-h-[70vh]'>
        {isLoading || !productData || !selectedVariant ?
          <div className='p-6'>
            <DialogTitle className='sr-only'>
              Laster produktinformasjon
            </DialogTitle>
            <DialogDescription className='sr-only'>
              Vinduet viser detaljer om valgt produkt.
            </DialogDescription>
            <QuickViewModalSkeleton />
          </div>
        : <>
            <DialogHeader className='space-y-3 py-2 pr-10'>
              <DialogTitle className='font-google-sans text-3xl font-bold text-popover-foreground'>
                {productData.title}
              </DialogTitle>
              {hideDescription ?
                <DialogDescription className='sr-only'>
                  Hurtigvisning av {productData.title}.
                </DialogDescription>
              : productData.description ?
                <DialogDescription
                  render={
                    <p className='max-w-2xl text-base leading-relaxed text-popover-foreground/80' />
                  }
                >
                  {productData.description}
                </DialogDescription>
              : null}
            </DialogHeader>

            <div className='grid grid-cols-1 gap-10 pb-2 lg:grid-cols-2 lg:gap-12'>
              <div className='relative'>
                <div className='sticky top-6'>
                  <div className='relative aspect-square w-full overflow-hidden rounded-2xl shadow-lg'>
                    {featuredImage && (
                      <Image
                        src={featuredImage.url}
                        alt={
                          featuredImage.altText ??
                          productData.title
                        }
                        fill
                        sizes='(max-width: 1024px) 100vw, 50vw'
                        className='object-cover'
                        priority
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-8'>
                <div className='space-y-2'>
                  <p className='text-sm tracking-wide text-popover-foreground/75 uppercase'>
                    Pris
                  </p>
                  <div className='font-google-sans text-3xl font-bold text-popover-foreground'>
                    <Price
                      amount={selectedVariant.price.amount}
                      currencyCode={
                        selectedVariant.price.currencyCode
                      }
                    />
                  </div>
                </div>

                <div className='space-y-6'>
                  <VariantSelectors
                    product={productData}
                    selectedVariant={selectedVariant}
                    onUpdateVariant={updateVariant}
                  />
                </div>

                <div className='mt-auto space-y-4'>
                  <AddToCart
                    product={productData}
                    selectedVariant={selectedVariant}
                    showAddToCartAction={false}
                    surface='inherit'
                  />
                </div>
              </div>
            </div>
          </>
        }
      </DialogContent>
    </Dialog>
  )
}
