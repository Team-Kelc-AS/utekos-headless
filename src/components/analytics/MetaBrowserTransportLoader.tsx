'use client'

import Script from 'next/script'

export function MetaBrowserTransportLoader() {
  return (
    <Script
      id='meta-pixel-canonical-browser'
      src='/analytics/meta-pixel-canonical-v1.js'
      strategy='afterInteractive'
    />
  )
}
