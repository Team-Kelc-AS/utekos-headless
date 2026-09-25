'use client'

import { KlarnaProductExpressCheckout } from '@/components/klarna/components/KlarnaProductExpressCheckout'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import styles from './StickyCTA.module.css'

export default function StickyCTAKlarna({
  product,
  selectedVariant
}: {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant
}) {
  return (
    <KlarnaProductExpressCheckout
      key={selectedVariant.id}
      product={product}
      selectedVariant={selectedVariant}
      quantity={1}
      theme='default'
      className={styles.klarna ?? ''}
      buttonContainerClassName={styles.klarnaButton ?? ''}
      loadingFallback={
        <span className={styles.klarnaLoading} role='status'>
          Laster Klarna…
        </span>
      }
    />
  )
}
