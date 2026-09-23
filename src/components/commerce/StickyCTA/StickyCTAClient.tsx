'use client'

import { useEffect, useState } from 'react'
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

export function StickyCTAClient({
  purchase
}: {
  purchase: TechdownPurchaseData
}) {
  const [currentPurchase, setCurrentPurchase] = useState(purchase)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const selectionContext = useStickyCTASelection()
  const setSelection = selectionContext?.setSelection
  const selectedId =
    selectionContext?.selectedVariantId ??
    currentPurchase.initialVariantId
  const selectedVariant = currentPurchase.variants.find(
    variant => variant.id === selectedId
  )

  useEffect(() => {
    if (!selectedVariant) {
      setSelection?.(null)
      return
    }

    setSelection?.({
      productHandle:
        currentPurchase.productPath === '/produkter/techdown' ?
          'utekos-techdown'
        : currentPurchase.productPath.replace('/produkter/', ''),
      productName: currentPurchase.productName,
      priceAmount: Number(selectedVariant.price.amount)
    })
  }, [currentPurchase, selectedVariant, setSelection])

  function scrollToPurchase() {
    document
      .getElementById('techdown-size-heading')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <StickyCTASurface>
      <div className={styles.bar}>
        <div className={styles.productInfo}>
          <button
            type='button'
            className={styles.productTrigger}
            aria-label='Endre produkt og størrelse'
            onClick={() => setCatalogOpen(true)}
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
          {currentPurchase.productPath === '/produkter/techdown' ?
            <button
              type='button'
              className={styles.buy}
              onClick={scrollToPurchase}
            >
              {selectedVariant?.availableForSale ?
                'Kjøp'
              : 'Velg størrelse'}
            </button>
          : <a className={styles.buy} href={currentPurchase.productPath}>
              Se produkt
            </a>}
        </div>
      </div>
      {catalogOpen && (
        <StickyCTACatalogDialog
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
