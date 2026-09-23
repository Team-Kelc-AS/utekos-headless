'use client'

import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import { useStickyCTASelection } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'
import { useCanonicalAddToCart } from '@/hooks/useCanonicalAddToCart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import styles from './TechdownContent.module.css'

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

    void addToCart({
      product: payload.product,
      variant: selectedVariant,
      quantity: 1,
      openCart: true
    })
  }

  return (
    <div className={styles.purchaseActions}>
      <button
        type='button'
        className={styles.addToCart}
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
      {canBuy && selectedVariant ?
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
            <span className={styles.expressCheckoutLoading} role='status'>
              Laster Klarna…
            </span>
          }
        />
      : null}
    </div>
  )
}
