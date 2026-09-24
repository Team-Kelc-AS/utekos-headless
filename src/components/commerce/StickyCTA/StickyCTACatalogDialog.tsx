'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { formatPrice } from '@/lib/utils/formatPrice'
import type { StickyCatalogProduct } from './techdownPurchaseData'
import styles from './StickyCTA.module.css'

type StickyCatalogResponse = { products: StickyCatalogProduct[] }

export default function StickyCTACatalogDialog({
  selectedVariantId,
  products: initialProducts,
  onClose,
  onSelect
}: {
  selectedVariantId: string | null
  products?: StickyCatalogProduct[]
  onClose: () => void
  onSelect: (purchase: StickyCatalogProduct) => void
}) {
  const [catalog, setCatalog] = useState<StickyCatalogProduct[] | null>(
    initialProducts ?? null
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (initialProducts) {
      setCatalog(initialProducts)
      return
    }

    const controller = new AbortController()

    void fetch('/api/commerce/sticky-catalog', {
      signal: controller.signal
    })
      .then(async response => {
        if (!response.ok) throw new Error('Sticky catalog request failed')
        return (await response.json()) as StickyCatalogResponse
      })
      .then(response => setCatalog(response.products))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setFailed(true)
      })

    return () => controller.abort()
  }, [initialProducts])

  return (
    <PopoverPrimitive.Root defaultOpen onOpenChange={open => !open && onClose()}>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side='top'
          align='start'
          sideOffset={16}
          collisionPadding={12}
          className={styles.positioner}
        >
          <PopoverPrimitive.Popup className={styles.popup}>
            <div className={styles.heading}>
              <div>
                <PopoverPrimitive.Title className={styles.title}>
                  {initialProducts?.length === 1 ?
                    'Velg variant'
                  : 'Velg din Utekos'}
                </PopoverPrimitive.Title>
                <PopoverPrimitive.Description className={styles.description}>
                  {initialProducts?.length === 1 ?
                    'Velg TechDown-størrelse.'
                  : 'Velg produkt og størrelse.'}
                </PopoverPrimitive.Description>
              </div>
              <PopoverPrimitive.Close
                className={styles.close}
                aria-label='Lukk produktvalg'
              >
                <X size={20} aria-hidden />
              </PopoverPrimitive.Close>
            </div>
            <div className={styles.catalog}>
              {failed ? (
                <p role='alert'>Produktene kunne ikke lastes.</p>
              ) : !catalog ? (
                <p role='status'>Laster produkter…</p>
              ) : catalog.map(product => (
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
                            <span>{variant.label || product.productName}</span>
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
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
