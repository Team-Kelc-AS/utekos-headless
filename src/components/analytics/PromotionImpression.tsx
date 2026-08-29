'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { reportCanonicalViewPromotion } from '@/lib/analytics/viewPromotionReporter'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { isPromotionIntersectionVisible } from './promotionIntersectionVisibility'

type PromotionImpressionProps = {
  children: ReactNode
  className?: string
  creativeName: string
  creativeSlot: string
  minimumVisibleRatio?: number
  promotionId: string
  promotionName: string
}

const DWELL_MS = 1000
const VIEWPORT_EDGE_INSET = '-96px 0px -96px 0px'

export function PromotionImpression({
  children,
  className,
  creativeName,
  creativeSlot,
  minimumVisibleRatio = 0,
  promotionId,
  promotionName
}: PromotionImpressionProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reportedKeys = useRef(new Set<string>())
  const dwellTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const clearDwell = () => {
      if (dwellTimer.current != null) {
        clearTimeout(dwellTimer.current)
        dwellTimer.current = null
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (
          !entry ||
          !isPromotionIntersectionVisible(
            entry,
            minimumVisibleRatio
          )
        ) {
          clearDwell()
          return
        }

        if (dwellTimer.current != null) return

        dwellTimer.current = setTimeout(() => {
          dwellTimer.current = null

          const pageView = browserPageViewSession.ensure({
            pageUrl: window.location.href,
            documentReferrer: document.referrer
          })
          const reportKey = `${pageView.pageViewId}:${promotionId}:1`

          if (reportedKeys.current.has(reportKey)) return
          reportedKeys.current.add(reportKey)

          reportCanonicalViewPromotion({
            pageViewId: pageView.pageViewId,
            customData: {
              promotion_id: promotionId,
              promotion_name: promotionName,
              creative_name: creativeName,
              creative_slot: creativeSlot,
              impression_sequence: 1
            }
          })
        }, DWELL_MS)
      },
      {
        rootMargin: VIEWPORT_EDGE_INSET,
        threshold: minimumVisibleRatio
      }
    )

    observer.observe(node)

    return () => {
      clearDwell()
      observer.disconnect()
    }
  }, [
    creativeName,
    creativeSlot,
    minimumVisibleRatio,
    promotionId,
    promotionName
  ])

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  )
}
