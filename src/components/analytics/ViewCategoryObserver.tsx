'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { reportCanonicalViewCategory } from '@/lib/analytics/viewCategoryReporter'
import { browserPageViewSession } from '@/lib/analytics/pageViewSession'

export type ViewCategoryObserverProps = {
  categoryId: string
  categoryName: string
  contentIds?: readonly string[]
}

function emitViewCategory(
  categoryId: string,
  categoryName: string,
  contentIds: readonly string[] | undefined
) {
  const pageView = browserPageViewSession.ensure({
    pageUrl: window.location.href,
    ...(document.referrer ?
      { documentReferrer: document.referrer }
    : {})
  })

  return reportCanonicalViewCategory({
    pageViewId: pageView.pageViewId,
    customData: {
      category_id: categoryId,
      category_name: categoryName,
      view_sequence: 1,
      ...(contentIds && contentIds.length > 0 ?
        { content_ids: [...contentIds] }
      : {})
    }
  })
}

export function ViewCategoryObserver({
  categoryId,
  categoryName,
  contentIds
}: ViewCategoryObserverProps) {
  const pathname = usePathname()
  const emittedForPageViewRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let cancelled = false
    let stopReporter = () => {}

    function tryEmit() {
      if (cancelled) return

      const pageView = browserPageViewSession.ensure({
        pageUrl: window.location.href,
        ...(document.referrer ?
          { documentReferrer: document.referrer }
        : {})
      })

      if (emittedForPageViewRef.current === pageView.pageViewId) {
        return
      }

      emittedForPageViewRef.current = pageView.pageViewId
      stopReporter = emitViewCategory(
        categoryId,
        categoryName,
        contentIds
      )
    }

    tryEmit()

    return () => {
      cancelled = true
      stopReporter()
    }
  }, [pathname, categoryId, categoryName, contentIds])

  return null
}
