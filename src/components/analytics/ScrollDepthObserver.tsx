'use client'

import { useEffect, useRef } from 'react'
import { useCookiebotConsent } from '@/lib/consent/useCookiebotConsent'
import { hasBrowserCollectionConsent } from '@/lib/analytics/hasBrowserCollectionConsent'
import { usePathname, useSearchParams } from 'next/navigation'
import { reportCanonicalScrollDepth } from '@/lib/analytics/scrollDepthReporter'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'
import { readBrowserReporterContext } from '@/lib/analytics/browserReporterContext'

const THRESHOLDS = [25, 50, 75, 90] as const

export function ScrollDepthObserver() {
  const consent = useCookiebotConsent()
  const permitted = consent.statistics || consent.marketing
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const emittedRef = useRef(new Set<number>())

  useEffect(() => {
    emittedRef.current = new Set()
    if (!permitted) return

    function handleScroll() {
      if (!hasBrowserCollectionConsent()) return
      const clientContext = readBrowserReporterContext()
      if (!clientContext) return
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      )
      const viewportHeight = window.innerHeight
      const scrollTop = window.scrollY
      const scrollableHeight = documentHeight - viewportHeight

      if (scrollableHeight <= 0) return

      const percentScrolled = Math.min(
        100,
        Math.round(
          ((scrollTop + viewportHeight) / documentHeight) * 100
        )
      )

      for (const threshold of THRESHOLDS) {
        if (
          percentScrolled < threshold ||
          emittedRef.current.has(threshold)
        ) {
          continue
        }

        emittedRef.current.add(threshold)

        const pageView = browserPageViewSession.ensure({
          pageUrl: clientContext.pageUrl,
          ...(clientContext.documentReferrer ?
            { documentReferrer: clientContext.documentReferrer }
          : {})
        })

        reportCanonicalScrollDepth({
          pageViewId: pageView.pageViewId,
          customData: {
            threshold,
            percent_scrolled: threshold,
            document_height: documentHeight
          }
        })
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, {
      passive: true
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [pathname, search, permitted])

  return null
}
