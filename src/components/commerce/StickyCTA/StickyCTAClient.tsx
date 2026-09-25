'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import dynamic from 'next/dynamic'
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

function preloadCheckoutChunks() {
  void import('./StickyCTAKlarna')
  void import('./StickyCTACatalogDialog')
}

function reportDeferredTrackingError(
  error: unknown,
  operation: string
) {
  void import('@/lib/observability/client/reportClientCaughtError')
    .then(({ reportClientCaughtError }) => {
      reportClientCaughtError(error, operation)
    })
    .catch(() => {})
}

function reportStickyVariantSelection(input: {
  destinationUrl: string
  previousVariantId: string | null
  product: TechdownPurchaseData['checkout']['product']
  variant: TechdownPurchaseData['checkout']['variants'][number]
}) {
  if (input.variant.id === input.previousVariantId) return

  const eventId = globalThis.crypto.randomUUID()
  const interactionId = globalThis.crypto.randomUUID()

  void import('@/lib/analytics/selectItemReporter')
    .then(({ reportCanonicalSelectItem }) => {
      reportCanonicalSelectItem({
        destinationUrl: input.destinationUrl,
        eventId,
        interactionId,
        itemListId: 'sticky-cta-catalog',
        product: input.product,
        variant: input.variant
      })
    })
    .catch(error => {
      reportDeferredTrackingError(
        error,
        'sticky_cta.catalog.select_item_import'
      )
    })

  void import('@/lib/analytics/viewItemReporter')
    .then(({ reportCanonicalViewItem }) => {
      reportCanonicalViewItem({
        product: input.product,
        variant: input.variant
      })
    })
    .catch(error => {
      reportDeferredTrackingError(
        error,
        'sticky_cta.catalog.view_item_import'
      )
    })

  void import('@vercel/analytics')
    .then(({ track }) => {
      track('Sticky CTA variant selected', {
        event_id: eventId,
        interaction_id: interactionId,
        item_list_id: 'sticky-cta-catalog',
        product_id: input.product.id,
        variant_id: input.variant.id,
        product_handle: input.product.handle,
        availability:
          input.variant.availableForSale ?
            'available'
          : 'unavailable'
      })
    })
    .catch(error => {
      reportDeferredTrackingError(
        error,
        'sticky_cta.catalog.vercel_tracking_import'
      )
    })
}

export function StickyCTAClient({
  purchase
}: {
  purchase: TechdownPurchaseData
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
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
          <button
            ref={triggerRef}
            type='button'
            className={styles.productTrigger}
            aria-label='Endre variant'
            aria-haspopup='dialog'
            aria-expanded={catalogOpen}
            onPointerEnter={preloadCheckoutChunks}
            onFocus={preloadCheckoutChunks}
            onClick={() => {
              preloadCheckoutChunks()
              setCatalogOpen(true)
            }}
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
          </button>
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
          anchor={triggerRef as RefObject<Element | null>}
          products={[currentPurchase]}
          selectedVariantId={selectedId}
          onClose={() => setCatalogOpen(false)}
          onSelect={selectedPurchase => {
            const nextVariant =
              selectedPurchase.checkout.variants.find(
                variant =>
                  variant.id === selectedPurchase.initialVariantId
              ) ?? null

            if (nextVariant) {
              reportStickyVariantSelection({
                destinationUrl: new URL(
                  selectedPurchase.productPath,
                  window.location.origin
                ).href,
                previousVariantId: selectedId,
                product: selectedPurchase.checkout.product,
                variant: nextVariant
              })
            }

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
