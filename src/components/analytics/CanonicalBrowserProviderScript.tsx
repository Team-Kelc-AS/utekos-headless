'use client'

import Script from 'next/script'

type CanonicalBrowserProviderScriptProps = {
  id: string
  src: string
  'data-pixel-id'?: string
  'data-tag-id'?: string
}

export function CanonicalBrowserProviderScript({
  id,
  src,
  'data-pixel-id': dataPixelId,
  'data-tag-id': dataTagId
}: CanonicalBrowserProviderScriptProps) {
  return (
    <Script
      id={id}
      src={src}
      strategy='afterInteractive'
      {...(dataPixelId ? { 'data-pixel-id': dataPixelId } : {})}
      {...(dataTagId ? { 'data-tag-id': dataTagId } : {})}
    />
  )
}
