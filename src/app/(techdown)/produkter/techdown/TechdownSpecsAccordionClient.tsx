'use client'

import { useRef, useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { getNewlyOpenedAccordionIds } from '@/lib/analytics/getNewlyOpenedAccordionIds'
import { useStickyCTASelection } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'
import type {
  ProductAccordionGroup,
  ProductAccordionSection
} from '@/db/data/products/product-page-content'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import styles from './TechdownContent.module.css'

function SpecGroup({ group }: { group: ProductAccordionGroup }) {
  return (
    <div className={styles.specGroup}>
      {group.title ? <h3>{group.title}</h3> : null}

      {group.rows && group.rows.length > 0 ?
        <dl className={styles.specRows}>
          {group.rows.map(row => (
            <div key={row.label} className={styles.specRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      : null}

      {group.paragraphs?.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {group.items && group.items.length > 0 ?
        <ul>
          {group.items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      : null}

      {group.note ?
        <aside>
          <strong>{group.note.title}</strong>
          <p>{group.note.text}</p>
        </aside>
      : null}
    </div>
  )
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

function reportOpenedSection(input: {
  accordionId: string
  accordionTitle: string
  interactionSequence: number
  product: ProductCommerceModel
  variant: ProductPurchaseVariant
}) {
  void Promise.all([
    import('@/lib/analytics/interactWithAccordionReporter'),
    import('@/lib/analytics/shopifyViewItemCommerce')
  ])
    .then(
      ([
        { reportCanonicalInteractWithAccordion },
        { mapShopifyViewItem }
      ]) => {
        reportCanonicalInteractWithAccordion({
          ...mapShopifyViewItem({
            product: input.product,
            variant: input.variant
          }),
          accordion_id: input.accordionId,
          accordion_title: input.accordionTitle,
          interaction_sequence: input.interactionSequence,
          interaction_type: 'open'
        })
      }
    )
    .catch(error => {
      reportDeferredTrackingError(
        error,
        'techdown.specs_accordion.interact_import'
      )
    })
}

export function TechdownSpecsAccordionClient({
  sections,
  product,
  variants,
  initialVariantId
}: {
  sections: readonly ProductAccordionSection[]
  product?: ProductCommerceModel
  variants?: readonly ProductPurchaseVariant[]
  initialVariantId?: string
}) {
  const [openValues, setOpenValues] = useState<string[]>([])
  const openValuesRef = useRef<string[]>([])
  const interactionSequence = useRef(0)
  const selectedVariantId =
    useStickyCTASelection()?.selectedVariantId ??
    initialVariantId
  const selectedVariant =
    variants?.find(variant => variant.id === selectedVariantId) ??
    variants?.[0] ??
    null

  return (
    <section
      className={styles.specs}
      aria-labelledby='techdown-specs-heading'
    >
      <h2 id='techdown-specs-heading'>Produktspesifikasjoner</h2>
      <Accordion
        multiple={false}
        value={openValues}
        onValueChange={nextValues => {
          const newlyOpened = getNewlyOpenedAccordionIds(
            openValuesRef.current,
            nextValues
          )
          openValuesRef.current = nextValues
          setOpenValues(nextValues)

          if (!product || !selectedVariant || newlyOpened.length === 0) {
            return
          }

          for (const accordionId of newlyOpened) {
            const section = sections.find(
              candidate => candidate.id === accordionId
            )
            if (!section) continue

            interactionSequence.current += 1
            reportOpenedSection({
              accordionId: section.id,
              accordionTitle: section.title,
              interactionSequence: interactionSequence.current,
              product,
              variant: selectedVariant
            })
          }
        }}
        className={styles.specsAccordion}
      >
        {sections.map(section => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className={styles.specsItem}
          >
            <AccordionTrigger className={styles.specsTrigger}>
              {section.title}
            </AccordionTrigger>
            <AccordionContent className={styles.specsContent}>
              {section.groups.map((group, index) => (
                <SpecGroup
                  key={`${section.id}-${group.title ?? index}`}
                  group={group}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
