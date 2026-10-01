'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useStickyCTASelection } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import styles from './TechdownContent.module.css'

const KlarnaProductExpressCheckout = dynamic(
  () =>
    import('@/components/klarna/components/KlarnaProductExpressCheckout').then(
      module => module.KlarnaProductExpressCheckout
    ),
  { ssr: false }
)

export type TechdownPurchasePayload = {
  initialVariantId: string
  product: ProductCartModel
  variants: ProductPurchaseVariant[]
}

export function TechdownPurchaseActions({
  payload
}: {
  payload: TechdownPurchasePayload
}) {
  const [canLoadKlarna, setCanLoadKlarna] = useState(false)

  useEffect(() => {
    let idleHandle: number | undefined
    let timerHandle: number | undefined

    const scheduleKlarna = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(
          () => setCanLoadKlarna(true),
          { timeout: 2000 }
        )
      } else {
        timerHandle = window.setTimeout(
          () => setCanLoadKlarna(true),
          0
        )
      }
    }

    if (document.readyState === 'complete') {
      scheduleKlarna()
    } else {
      window.addEventListener('load', scheduleKlarna, {
        once: true
      })
    }

    return () => {
      window.removeEventListener('load', scheduleKlarna)
      if (idleHandle !== undefined) {
        window.cancelIdleCallback(idleHandle)
      }
      if (timerHandle !== undefined) {
        window.clearTimeout(timerHandle)
      }
    }
  }, [])

  const selectedVariantId =
    useStickyCTASelection()?.selectedVariantId ??
    payload.initialVariantId
  const selectedVariant =
    payload.variants.find(
      variant => variant.id === selectedVariantId
    ) ?? null
  const { addToCart, isPending, isCartBusy } =
    useCanonicalAddToCart()
  const canBuy = selectedVariant?.availableForSale === true
  const busy = isPending || isCartBusy

  function addSelectedVariant() {
    if (!selectedVariant || !canBuy || busy) return

    void (async () => {
      await addToCart({
        product: payload.product,
        variant: selectedVariant,
        quantity: 1,
        openCart: true
      })
    })()
  }

  const addToCartTrackData = {
    page: 'techdown',
    section: 'purchase',
    target: 'add-to-cart',
    product_handle: payload.product.handle,
    ...(selectedVariant ?
      {
        variant_id: selectedVariant.id,
        variant_title: selectedVariant.title
      }
    : {})
  }

  return (
    <div className={styles.purchaseActions}>
      <button
        type='button'
        className={styles.addToCart}
        data-track='TechDownAddToCartClick'
        data-track-data={JSON.stringify(addToCartTrackData)}
        disabled={!canBuy || busy}
        aria-busy={isPending}
        onClick={addSelectedVariant}
      >
        {isPending ?
          'Legger i handlekurven…'
        : !selectedVariant ?
          'Velg størrelse'
        : canBuy ?
          'Legg i handlekurv'
        : 'Utsolgt'}
      </button>
      {canBuy && selectedVariant && canLoadKlarna ?
        <KlarnaProductExpressCheckout
          key={selectedVariant.id}
          product={payload.product}
          selectedVariant={selectedVariant}
          quantity={1}
          disabled={busy}
          theme='default'
          className={styles.expressCheckout ?? ''}
          buttonContainerClassName={
            styles.expressCheckoutButton ?? ''
          }
          loadingFallback={
            <span
              className={styles.expressCheckoutLoading}
              role='status'
            >
              Laster Klarna…
            </span>
          }
        />
      : canBuy && selectedVariant ?
        <span
          className={styles.expressCheckoutLoading}
          role='status'
        >
          Laster Klarna…
        </span>
      : null}
    </div>
  )
}
