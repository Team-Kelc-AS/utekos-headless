'use client'

import Script from 'next/script'

export function MetaBrowserTransportLoader({
  deferUntilIdle = false
}: {
  deferUntilIdle?: boolean
}) {
  return (
    <Script
      id='meta-pixel-canonical-browser'
      src='/analytics/meta-pixel-canonical-v1.js'
      strategy={
        deferUntilIdle ? 'lazyOnload' : 'afterInteractive'
      }
    />
  )
}
