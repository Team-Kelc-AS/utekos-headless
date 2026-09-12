'use client'

import { useEffect, useState } from 'react'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'

const DEFAULT_ROOT_MARGIN = '800px 0px'

export function DeferredKlarnaOnSiteMessaging({
  rootMargin = DEFAULT_ROOT_MARGIN
}: {
  rootMargin?: string
}) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return

    if (window.location.hash === '#purchase-section') {
      setShouldLoad(true)
      return
    }

    const target = document.getElementById('purchase-section')
    if (!target || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setShouldLoad(true)
        }
      },
      { rootMargin, threshold: 0 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [rootMargin, shouldLoad])

  if (!shouldLoad) return null

  return <KlarnaOnSiteMessagingScript strategy='lazyOnload' />
}
