// Path: src/app/skreddersy-varmen/utekos-orginal/components/StickyMobileAction.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion
} from 'motion/react'
import { ArrowDown, X } from 'lucide-react'
import { cn } from '@/lib/utils/className'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { reportLandingSelectPromotion } from '@/app/skreddersy-varmen/utils/reportLandingSelectPromotion'
import { reportCanonicalViewPromotion } from '@/lib/analytics/viewPromotionReporter'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'

const DISMISS_KEY = 'utekos:sticky-mobile-dismissed'
const IMPRESSION_DWELL_MS = 1000

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-dark-primary focus-visible:ring-2 focus-visible:ring-foreground/20 dark:focus-visible:ring-dark-foreground/20'

export function StickyMobileAction() {
  const reduced = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const rafRef = useRef<number | null>(null)
  const reportedPromotionPageViewId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      try {
        if (
          !cancelled &&
          sessionStorage.getItem(DISMISS_KEY) === '1'
        ) {
          setIsDismissed(true)
        }
      } catch {
        // SSR / privacy mode — silently ignore
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const compute = () => {
      if (isDismissed) {
        setIsVisible(false)
        return
      }
      const show = window.scrollY > 800
      const purchaseSection = document.getElementById(
        'purchase-section'
      )
      if (purchaseSection) {
        const rect = purchaseSection.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom >= 0) {
          setIsVisible(false)
          return
        }
      }
      setIsVisible(show)
    }

    const onScroll = () => {
      if (rafRef.current != null) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        compute()
      })
    }
    window.addEventListener('scroll', onScroll, {
      passive: true
    })
    compute()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current != null)
        cancelAnimationFrame(rafRef.current)
    }
  }, [isDismissed])

  useEffect(() => {
    if (!isVisible) return

    const timer = window.setTimeout(() => {
      const pageView = browserPageViewSession.ensure({
        pageUrl: window.location.href,
        documentReferrer: document.referrer
      })

      if (
        reportedPromotionPageViewId.current ===
        pageView.pageViewId
      ) {
        return
      }
      reportedPromotionPageViewId.current = pageView.pageViewId

      reportCanonicalViewPromotion({
        pageViewId: pageView.pageViewId,
        customData: {
          promotion_id: 'skreddersy-varmen-sticky',
          promotion_name: 'Skreddersy varmen',
          creative_name: 'Mobil bestillingssnarvei',
          creative_slot: 'sticky_mobile',
          impression_sequence: 1
        }
      })
    }, IMPRESSION_DWELL_MS)

    return () => window.clearTimeout(timer)
  }, [isVisible])

  const scrollToPurchase = (
    promotion: 'stickyCta' | 'stickyOrder'
  ) => {
    reportLandingSelectPromotion(promotion)
    void scrollToElement('purchase-section', {
      offsetY: 72,
      reducedMotion: reduced
    })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore storage failures
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role='region'
          aria-label='Snarvei til bestilling'
          initial={
            reduced ? { opacity: 0 } : { y: '120%', opacity: 0 }
          }
          animate={
            reduced ? { opacity: 1 } : { y: 0, opacity: 1 }
          }
          exit={
            reduced ? { opacity: 0 } : { y: '120%', opacity: 0 }
          }
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className='fixed inset-x-3 bottom-3 z-50 lg:hidden'
        >
          {/* Glasspanel-baren: Bruker background/95 for å gi en solid kontrast, uansett hvilken farge seksjonen bak har */}
          <div className='dark:border-dark-foreground/15 dark:bg-dark-background/95 flex items-center gap-2 rounded-full border border-foreground/15 bg-background/95 p-2 text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-md'>
            <button
              type='button'
              onClick={handleDismiss}
              data-track='SkreddersyVarmenStickyClose'
              aria-label='Lukk'
              className={cn(
                'dark:border-dark-foreground/10 dark:bg-dark-foreground/5 /60 dark:hover:bg-dark-foreground/10 dark:hover:text-dark-foreground flex size-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground sm:size-10',
                focusRing
              )}
            >
              <X size={14} aria-hidden className='sm:hidden' />
              <X
                size={16}
                aria-hidden
                className='hidden sm:block'
              />
            </button>

            <button
              type='button'
              onClick={() => scrollToPurchase('stickyCta')}
              data-track='SkreddersyVarmenStickyCta'
              className={cn(
                'group flex min-w-0 flex-1 flex-col justify-center rounded-3xl px-1.5 py-1 text-left transition-[opacity,transform] hover:opacity-90 active:scale-[0.99]',
                focusRing
              )}
            >
              <span className='sr-only'>Utekos TechDown™</span>
              <span
                aria-hidden
                className='flex min-w-0 items-baseline gap-1.5 leading-none'
              >
                <span className='truncate font-utekos-text-medium text-[11px] tracking-normal text-foreground sm:text-xs'>
                  Utekos
                </span>
                <span className='truncate font-utekos-text-medium text-[11px] tracking-normal text-foreground sm:text-xs'>
                  TechDown™
                </span>
              </span>
              <span className='/75 mt-0.5 truncate text-[13px] leading-tight font-medium text-foreground/75 sm:text-sm'>
                Fra 1790,-
              </span>
            </button>

            <BrandBadge
              asChild
              bgColor='var(--primary)'
              fgColor='var(--primary-foreground)'
              className={cn(
                'hover:bg-primary-hover font-google-sans h-11 shrink-0 gap-1.5 px-3.5 py-0 text-xs font-bold tracking-normal shadow-[0_4px_15px_rgba(255,180,120,0.15)] transition-[filter,transform,box-shadow] hover:text-primary-foreground hover:brightness-105 active:scale-[0.985] sm:px-5 sm:text-sm',
                focusRing
              )}
            >
              <button
                type='button'
                onClick={() => scrollToPurchase('stickyOrder')}
                data-track='SkreddersyVarmenTilBestilling'
              >
                <span className='whitespace-nowrap'>
                  Til bestilling
                </span>
                <ArrowDown
                  className='size-3.5 shrink-0 transition-transform group-hover:translate-y-0.5'
                  aria-hidden
                />
              </button>
            </BrandBadge>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
