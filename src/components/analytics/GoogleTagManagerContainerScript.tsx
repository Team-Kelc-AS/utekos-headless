'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { scheduleDeferredMarketingContainer } from '@/lib/analytics/scheduleDeferredMarketingContainer'
import {
  hasStoredCookiebotDecision,
  readCookiebotConsentCookie
} from '@/lib/consent/hasStoredCookiebotDecision'

export function GoogleTagManagerContainerScript({
  src
}: {
  src: string
}) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    return scheduleDeferredMarketingContainer(
      () => setShouldLoad(true),
      {
        eventTarget: window,
        hasStoredDecision: hasStoredCookiebotDecision(
          readCookiebotConsentCookie(document.cookie)
        )
      }
    )
  }, [])

  if (!shouldLoad) return null

  return (
    <Script
      id='_next-gtm'
      data-ntpc='GTM'
      src={src}
      strategy='afterInteractive'
    />
  )
}
