'use client'

import Script from 'next/script'
import { useCookiebotConsent } from '@/lib/consent/useCookiebotConsent'

type ConsentGrantedScriptProps = {
  id: string
  src: string
  'data-pixel-id'?: string
  'data-tag-id'?: string
}

export function ConsentGrantedScript({
  id,
  src,
  'data-pixel-id': dataPixelId,
  'data-tag-id': dataTagId
}: ConsentGrantedScriptProps) {
  const consent = useCookiebotConsent()

  if (!consent.marketing) return null

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
