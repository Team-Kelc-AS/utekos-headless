'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatPrice } from '@/lib/utils/formatPrice'
import styles from './StickyCTA.module.css'
import { StickyCTASurface } from './StickyCTASurface'
import { useStickyCTASelection } from './StickyCTASelectionContext'
import type { TechdownPurchaseData } from './techdownPurchaseData'

const StickyCTACatalogDialog = dynamic(
  () => import('./StickyCTACatalogDialog'),
  { ssr: false }
)

const StickyCTAKlarna = dynamic(() => import('./StickyCTAKlarna'), {
  ssr: false
})

function preloadKlarna() {
  void import('./StickyCTAKlarna')
}

export function StickyCTAClient({
  purchase
}: {
  purchase: TechdownPurchaseData
}) {
  const [currentPurchase, setCurrentPurchase] = useState(purchase)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [checkoutReady, setCheckoutReady] = useState(false)
  const selectionContext = useStickyCTASelection()
  const setSelection = selectionContext?.setSelection
  const selectedId =
    selectionContext?.selectedVariantId ??
    currentPurchase.initialVariantId
  const selectedVariant = currentPurchase.variants.find(
    variant => variant.id === selectedId
  )
  const checkoutVariant = currentPurchase.checkout.variants.find(
    variant => variant.id === selectedId
  )

  useEffect(() => {
    if (!selectedVariant) {
      setSelection?.(null)
      return
    }

    setSelection?.({
      productHandle: currentPurchase.checkout.product.handle,
      productName: currentPurchase.productName,
      priceAmount: Number(selectedVariant.price.amount)
    })
  }, [currentPurchase, selectedVariant, setSelection])

  useEffect(() => {
    const start = () => setCheckoutReady(true)
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(start, {
        timeout: 2000
      })
      return () => idleWindow.cancelIdleCallback?.(idleId)
    }

    const timeoutId = window.setTimeout(start, 1200)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <StickyCTASurface>
      <div className={styles.bar}>
        <div className={styles.productInfo}>
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type='button'
                    className={styles.productTrigger}
                    aria-label='Endre variant'
                    onPointerEnter={preloadKlarna}
                    onFocus={preloadKlarna}
                    onClick={() => setCatalogOpen(true)}
                  />
                }
              >
                <span className={styles.productName} aria-live='polite'>
                  {currentPurchase.productName}
                </span>
                {selectedVariant && (
                  <span className={styles.price} aria-live='polite'>
                    <span className={styles.sizeLabel}>
                      {selectedVariant.label}
                    </span>
                    <span className={styles.priceSeparator}>-</span>
                    <strong>{formatPrice(selectedVariant.price)}</strong>
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent
                side='top'
                sideOffset={10}
                className={styles.tooltipContent}
              >
                <p>Endre variant</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={styles.checkout}>
          {checkoutReady &&
          checkoutVariant?.availableForSale === true ?
            <StickyCTAKlarna
              product={currentPurchase.checkout.product}
              selectedVariant={checkoutVariant}
            />
          : <div className={styles.klarna} aria-busy='true'>
              <span className={styles.klarnaLoading} role='status'>
                {selectedVariant?.availableForSale === false ?
                  'Utsolgt'
                : 'Laster Klarna…'}
              </span>
            </div>}
        </div>
      </div>
      {catalogOpen && (
        <StickyCTACatalogDialog
          products={[currentPurchase]}
          selectedVariantId={selectedId}
          onClose={() => setCatalogOpen(false)}
          onSelect={selectedPurchase => {
            setCurrentPurchase(selectedPurchase)
            selectionContext?.setSelectedVariantId(
              selectedPurchase.initialVariantId
            )
            setCatalogOpen(false)
          }}
        />
      )}
    </StickyCTASurface>
  )
}
