'use client'

import { useEffect, useRef } from 'react'
import { getNewlyOpenedAccordionIds } from '@/lib/analytics/getNewlyOpenedAccordionIds'
import { reportCanonicalInteractWithAccordion } from '@/lib/analytics/interactWithAccordionReporter'
import { mapShopifyViewItem } from '@/lib/analytics/shopifyViewItemCommerce'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type ProductAccordionInteractionReporterProps = {
  containerId: string
  product: ProductCommerceModel
  selectedVariant: ProductPurchaseVariant
}

export function ProductAccordionInteractionReporter({
  containerId,
  product,
  selectedVariant
}: ProductAccordionInteractionReporterProps) {
  const interactionSequence = useRef(0)
  const openSectionIds = useRef<string[]>([])
  const hasInitialized = useRef(false)

  useEffect(() => {
    const container = document.getElementById(containerId)
    if (!container) return

    const getOpenSectionIds = () =>
      Array.from(
        container.querySelectorAll<HTMLDetailsElement>(
          'details[data-accordion-id][open]'
        )
      ).flatMap(section =>
        section.dataset.accordionId ?
          [section.dataset.accordionId]
        : []
      )

    const reportOpenedSection = (
      accordionId: string,
      accordionTitle: string
    ) => {
      interactionSequence.current += 1
      reportCanonicalInteractWithAccordion({
        ...mapShopifyViewItem({
          product,
          variant: selectedVariant
        }),
        accordion_id: accordionId,
        accordion_title: accordionTitle,
        interaction_sequence: interactionSequence.current,
        interaction_type: 'open'
      })
    }

    const initiallyOpenSections = Array.from(
      container.querySelectorAll<HTMLDetailsElement>(
        'details[data-accordion-id][open]'
      )
    )
    const initiallyOpenSectionIds = getOpenSectionIds()

    if (!hasInitialized.current) {
      for (const details of initiallyOpenSections) {
        const accordionId = details.dataset.accordionId
        const accordionTitle = details.dataset.accordionTitle
        if (!accordionId || !accordionTitle) continue
        reportOpenedSection(accordionId, accordionTitle)
      }
      hasInitialized.current = true
    }

    openSectionIds.current = initiallyOpenSectionIds

    const handleToggle = (event: Event) => {
      const details = event.target
      if (!(details instanceof HTMLDetailsElement)) return

      const accordionId = details.dataset.accordionId
      const accordionTitle = details.dataset.accordionTitle
      if (!accordionId || !accordionTitle) return

      const nextOpenSectionIds = getOpenSectionIds()
      const newlyOpenedIds = getNewlyOpenedAccordionIds(
        openSectionIds.current,
        nextOpenSectionIds
      )
      openSectionIds.current = nextOpenSectionIds

      if (!newlyOpenedIds.includes(accordionId)) return
      reportOpenedSection(accordionId, accordionTitle)
    }

    container.addEventListener('toggle', handleToggle, true)
    return () => {
      container.removeEventListener('toggle', handleToggle, true)
    }
  }, [containerId, product, selectedVariant])

  return null
}
