'use client'

import {
  useEffect,
  useId,
  useRef,
  type RefObject
} from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils/formatPrice'
import type { StickyCatalogProduct } from './techdownPurchaseData'
import styles from './StickyCTA.module.css'

export default function StickyCTACatalogDialog({
  anchor,
  selectedVariantId,
  products,
  onClose,
  onSelect
}: {
  anchor: RefObject<Element | null>
  selectedVariantId: string | null
  products: StickyCatalogProduct[]
  onClose: () => void
  onSelect: (purchase: StickyCatalogProduct) => void
}) {
  const titleId = useId()
  const descriptionId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const singleProduct = products.length === 1

  useEffect(() => {
    const previous = document.activeElement
    const anchorElement = anchor.current
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = popupRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (
        previous instanceof HTMLElement &&
        document.contains(previous)
      ) {
        previous.focus()
      } else {
        ;(anchorElement as HTMLElement | null)?.focus?.()
      }
    }
  }, [anchor, onClose])

  return createPortal(
    <div className={styles.catalogLayer}>
      <div
        className={styles.backdrop}
        aria-hidden='true'
        onClick={onClose}
      />
      <div
        ref={popupRef}
        className={styles.popup}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={styles.heading}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {singleProduct ? 'Velg variant' : 'Velg din Utekos'}
            </h2>
            <p id={descriptionId} className={styles.description}>
              {singleProduct ?
                'Velg TechDown-størrelse.'
              : 'Velg produkt og størrelse.'}
            </p>
          </div>
          <button
            ref={closeRef}
            type='button'
            className={styles.close}
            aria-label='Lukk produktvalg'
            onClick={onClose}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className={styles.catalog}>
          {products.map(product => (
            <section
              key={product.productId}
              aria-label={product.productName}
              className={styles.product}
            >
              <h3>{product.productName}</h3>
              <div className={styles.variants}>
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    type='button'
                    className={styles.option}
                    aria-pressed={selectedVariantId === variant.id}
                    onClick={() =>
                      onSelect({
                        ...product,
                        initialVariantId: variant.id
                      })
                    }
                  >
                    <span className={styles.optionText}>
                      <span>
                        {variant.label || product.productName}
                      </span>
                      <span className={styles.optionMeta}>
                        {formatPrice(variant.price)}
                        {!variant.availableForSale && ' · Utsolgt'}
                      </span>
                    </span>
                    {selectedVariantId === variant.id && (
                      <Check
                        size={20}
                        aria-hidden
                        className={styles.check}
                      />
                    )}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
