'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { loadKlarnaPublicConfig } from '@/components/klarna/utils/loadKlarnaPublicConfig'
import type { KlarnaPublicConfig } from '@/components/klarna/schemas/klarnaPublicConfigSchema'

const KLARNA_ON_SITE_MESSAGING_SCRIPT_ID = 'klarna-on-site-messaging-websdk'
const KLARNA_ON_SITE_MESSAGING_SCRIPT_URL = 'https://js.klarna.com/web-sdk/v1/klarna.js'

export function KlarnaOnSiteMessagingScript() {
  const [config, setConfig] = useState<KlarnaPublicConfig | null>(null)

  useEffect(() => {
    let isActive = true

    void loadKlarnaPublicConfig()
      .then(nextConfig => {
        if (isActive) {
          setConfig(nextConfig)
        }
      })
      .catch(() => {
        if (isActive) {
          setConfig(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  if (!config) {
    return null
  }

  return (
    <Script
      id={KLARNA_ON_SITE_MESSAGING_SCRIPT_ID}
      src={KLARNA_ON_SITE_MESSAGING_SCRIPT_URL}
      strategy='afterInteractive'
      data-locale='nb-NO'
      data-client-id={config.client_id}
      data-environment={config.environment}
      onError={(error: Error) => {
        console.error('Klarna On-site Messaging WebSDK failed to load', error)
      }}
    />
  )
}
