'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { ArrowDown, X } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { reportCanonicalViewPromotion } from '@/lib/analytics/viewPromotionReporter'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { reportComfyrobePurchaseSelection } from '../lib/reportComfyrobePurchaseSelection'
import type { ComfyrobeOfferSummary } from '../lib/buildComfyrobeOfferSummary'

const DISMISS_KEY = 'utekos:comfyrobe-sticky-dismissed'
const IMPRESSION_DWELL_MS = 1000

export function ComfyrobeStickyPurchase({
  offer
}: {
  offer: ComfyrobeOfferSummary | null
}) {
  const reducedMotion = useReducedMotion()
  const [heroHasPassed, setHeroHasPassed] = useState(false)
  const [purchaseHasBeenReached, setPurchaseHasBeenReached] =
    useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const reportedPageViewId = useRef<string | null>(null)
  const isVisible =
    Boolean(offer?.availableForSale) &&
    heroHasPassed &&
    !purchaseHasBeenReached &&
    !isDismissed

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      try {
        if (!cancelled) {
          setIsDismissed(
            sessionStorage.getItem(DISMISS_KEY) === '1'
          )
        }
      } catch {
        if (!cancelled) setIsDismissed(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const hero = document.getElementById('comfyrobe-hero')
    const purchase = document.getElementById('purchase-section')
    if (!hero || !purchase) return

    const heroObserver = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        setHeroHasPassed(
          !entry.isIntersecting && entry.boundingClientRect.bottom <= 0
        )
      },
      { threshold: 0 }
    )
    const purchaseObserver = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        if (
          entry.isIntersecting ||
          entry.boundingClientRect.bottom <= 0
        ) {
          setPurchaseHasBeenReached(true)
        }
      },
      { threshold: 0.08 }
    )

    heroObserver.observe(hero)
    purchaseObserver.observe(purchase)

    return () => {
      heroObserver.disconnect()
      purchaseObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const timer = window.setTimeout(() => {
      const pageView = browserPageViewSession.ensure({
        pageUrl: window.location.href,
        documentReferrer: document.referrer
      })
      if (reportedPageViewId.current === pageView.pageViewId) return

      reportedPageViewId.current = pageView.pageViewId
      reportCanonicalViewPromotion({
        pageViewId: pageView.pageViewId,
        customData: {
          promotion_id: 'comfyrobe-purchase',
          promotion_name: 'Comfyrobe',
          creative_name: 'Mobil kjøpslinje',
          creative_slot: 'sticky_mobile',
          impression_sequence: 1
        }
      })
    }, IMPRESSION_DWELL_MS)

    return () => window.clearTimeout(timer)
  }, [isVisible])

  const handlePurchase = () => {
    reportComfyrobePurchaseSelection(
      'Velg størrelse',
      'sticky_mobile'
    )
    void scrollToElement('purchase-section', {
      offsetY: 76,
      reducedMotion
    })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      return
    }
  }

  return (
    <AnimatePresence>
      {isVisible ?
        <m.div
          role='region'
          aria-label='Snarvei til størrelsevalg'
          initial={
            reducedMotion ?
              { opacity: 0 }
            : { opacity: 0, y: '120%' }
          }
          animate={{ opacity: 1, y: 0 }}
          exit={
            reducedMotion ?
              { opacity: 0 }
            : { opacity: 0, y: '120%' }
          }
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className='fixed inset-x-3 bottom-3 z-50 lg:hidden'
        >
          <div className='flex items-center gap-2 rounded-full border border-foreground/15 bg-background/96 p-2 text-foreground shadow-[0_14px_45px_rgba(0,0,0,0.3)] backdrop-blur-md dark:border-dark-foreground/15 dark:bg-dark-background/96'>
            <button
              type='button'
              aria-label='Lukk kjøpslinjen'
              data-track='ComfyrobeStickyClose'
              onClick={handleDismiss}
              className='flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            >
              <X className='size-4' aria-hidden />
            </button>

            <button
              type='button'
              onClick={handlePurchase}
              data-track='ComfyrobeStickyPrice'
              className='min-w-0 flex-1 rounded-2xl px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            >
              <span className='block truncate font-utekos-text-medium text-xs'>
                Comfyrobe™
              </span>
              <span className='mt-0.5 block truncate text-sm font-bold tabular-nums'>
                {offer?.priceLabel}
              </span>
            </button>

            <BrandBadge
              asChild
              bgColor='var(--primary)'
              fgColor='var(--primary-foreground)'
              className='min-h-11 shrink-0 px-4 py-2 text-sm font-bold transition-[filter,transform] hover:brightness-105 active:scale-[0.985]'
            >
              <button
                type='button'
                onClick={handlePurchase}
                data-track='ComfyrobeStickyCta'
              >
                Velg størrelse
                <ArrowDown className='size-4' aria-hidden />
              </button>
            </BrandBadge>
          </div>
        </m.div>
      : null}
    </AnimatePresence>
  )
}
