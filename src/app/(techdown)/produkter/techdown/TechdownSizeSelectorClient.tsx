'use client'

import { useRef, type KeyboardEvent } from 'react'
import { useStickyCTASelection } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'
import type { TechdownSizeSelectorModel } from './techdownSizeSelectorModel'
import styles from './TechdownContent.module.css'

const OPTION_PARAMS = ['farge', 'storrelse', 'kjonn', 'variant']

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

function replaceVariantUrl(href: string) {
  const current = new URL(window.location.href)
  const selection = new URL(href, current.origin)

  for (const parameter of OPTION_PARAMS) {
    current.searchParams.delete(parameter)
  }
  for (const [key, value] of selection.searchParams) {
    current.searchParams.set(key, value)
  }

  window.history.replaceState(
    window.history.state,
    '',
    `${current.pathname}?${current.searchParams.toString()}${current.hash}`
  )
}

export function TechdownSizeSelectorClient({
  model
}: {
  model: TechdownSizeSelectorModel
}) {
  const selectionContext = useStickyCTASelection()
  const selectedVariantId =
    selectionContext?.selectedVariantId ?? model.initialVariantId
  const selectedChoice = model.choices.find(
    choice => choice.variantId === selectedVariantId
  )
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  function selectChoice(
    choice: TechdownSizeSelectorModel['choices'][number]
  ) {
    if (choice.variantId === selectedVariantId) return

    selectionContext?.setSelectedVariantId(choice.variantId)
    replaceVariantUrl(choice.href)

    const eventId = globalThis.crypto.randomUUID()
    const interactionId = globalThis.crypto.randomUUID()
    const customData = {
      ...choice.tracking,
      interaction_id: interactionId,
      destination_url: new URL(
        choice.href,
        window.location.origin
      ).href
    }

    void import('@/lib/analytics/selectItemReporter')
      .then(({ reportCanonicalSelectItemCustomData }) => {
        reportCanonicalSelectItemCustomData({
          customData,
          eventId
        })
      })
      .catch(error => {
        reportDeferredTrackingError(
          error,
          'techdown.size_selector.canonical_tracking_import'
        )
      })

    void import('@/lib/analytics/viewItemReporter')
      .then(({ reportCanonicalViewItem }) => {
        reportCanonicalViewItem({
          product: model.product,
          variant: choice.variant
        })
      })
      .catch(error => {
        reportDeferredTrackingError(
          error,
          'techdown.size_selector.view_item_tracking_import'
        )
      })

    void import('@vercel/analytics')
      .then(({ track }) => {
        const item = customData.items[0]
        if (!item) return

        track('TechDown size selected', {
          event_id: eventId,
          interaction_id: interactionId,
          item_list_id: customData.item_list_id,
          product_id: item.product_id,
          variant_id: choice.variantId,
          size: choice.label,
          availability:
            choice.available ? 'available' : 'unavailable',
          currency: customData.currency,
          value: customData.gross_value
        })
      })
      .catch(error => {
        reportDeferredTrackingError(
          error,
          'techdown.size_selector.vercel_tracking_import'
        )
      })
  }

  function moveSelection(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
    let nextIndex: number | undefined

    if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown'
    ) {
      nextIndex = (index + 1) % model.choices.length
    } else if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      nextIndex =
        (index - 1 + model.choices.length) % model.choices.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = model.choices.length - 1
    }

    if (nextIndex === undefined) return

    const nextChoice = model.choices[nextIndex]
    if (!nextChoice) return

    event.preventDefault()
    selectChoice(nextChoice)
    optionRefs.current[nextIndex]?.focus()
  }

  return (
    <section
      className={styles.sizeSelector}
      aria-labelledby='techdown-size-heading'
    >
      <div className={styles.sizeSelectorHeading}>
        <h3 id='techdown-size-heading'>Velg størrelse</h3>
      </div>
      <div
        className={styles.sizeOptions}
        role='radiogroup'
        aria-label='Størrelse'
      >
        {model.choices.map((choice, index) => {
          const selected = choice.variantId === selectedVariantId

          return (
            <button
              key={choice.variantId}
              ref={element => {
                optionRefs.current[index] = element
              }}
              type='button'
              role='radio'
              aria-checked={selected}
              aria-label={`${choice.label}${choice.available ? '' : ', utsolgt'}`}
              tabIndex={
                selected || (!selectedChoice && index === 0) ?
                  0
                : -1
              }
              className={styles.sizeOption}
              data-selected={selected}
              data-available={choice.available}
              onClick={() => selectChoice(choice)}
              onKeyDown={event => moveSelection(event, index)}
            >
              <span className={styles.sizeName}>
                {choice.label}
              </span>
              {selected && (
                <span
                  className={styles.sizeCheck}
                  aria-hidden='true'
                >
                  ✓
                </span>
              )}
              {!choice.available && (
                <span className={styles.sizeUnavailable}>
                  Utsolgt
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
