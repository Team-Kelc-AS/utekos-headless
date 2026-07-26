'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import {
  COOKIEBOT_CONSENT_EVENTS,
  mapCookiebotConsentToShopify,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'

const SHOPIFY_CUSTOMER_PRIVACY_SRC =
  'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js'

type ShopifyConsent = {
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

type ShopifyCustomerPrivacyApi = {
  setTrackingConsent: (
    consent: ShopifyConsent & {
      headlessStorefront: true
      checkoutRootDomain: string
      storefrontRootDomain: string
      storefrontAccessToken: string
    },
    callback: (error?: unknown) => void
  ) => void
}

type ConsentBridgeWindow = Window & {
  Cookiebot?: CookiebotApi
  Shopify?: { customerPrivacy?: ShopifyCustomerPrivacyApi }
}

function submitShopifyConsent({
  consent,
  storefrontAccessToken
}: {
  consent: ShopifyConsent
  storefrontAccessToken: string
}): void {
  const api = (window as ConsentBridgeWindow).Shopify
    ?.customerPrivacy
  if (!api) return

  api.setTrackingConsent(
    {
      ...consent,
      headlessStorefront: true,
      checkoutRootDomain: 'kasse.utekos.no',
      storefrontRootDomain: 'utekos.no',
      storefrontAccessToken
    },
    error => {
      if (error && process.env.NODE_ENV !== 'production') {
        console.warn(
          'Shopify customer privacy consent sync failed'
        )
      }
    }
  )
}

export function ShopifyCustomerPrivacyBridge({
  storefrontAccessToken
}: {
  storefrontAccessToken?: string
}) {
  const [shouldLoadApi, setShouldLoadApi] = useState(false)
  const apiLoadedRef = useRef(false)
  const pendingConsentRef = useRef<ShopifyConsent | null>(null)

  useEffect(() => {
    if (!storefrontAccessToken) return

    const submitPendingConsent = () => {
      const consent = pendingConsentRef.current
      if (!consent || !apiLoadedRef.current) return

      submitShopifyConsent({ consent, storefrontAccessToken })
    }

    const syncCookiebotChoice = () => {
      const consent = mapCookiebotConsentToShopify(
        (window as ConsentBridgeWindow).Cookiebot
      )
      if (!consent) return

      pendingConsentRef.current = consent
      setShouldLoadApi(true)
      submitPendingConsent()
    }

    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      window.addEventListener(eventName, syncCookiebotChoice)
    }

    syncCookiebotChoice()

    return () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        window.removeEventListener(
          eventName,
          syncCookiebotChoice
        )
      }
    }
  }, [storefrontAccessToken])

  if (!storefrontAccessToken || !shouldLoadApi) return null

  return (
    <Script
      id='shopify-customer-privacy-api'
      src={SHOPIFY_CUSTOMER_PRIVACY_SRC}
      strategy='afterInteractive'
      onLoad={() => {
        apiLoadedRef.current = true
        const consent = pendingConsentRef.current
        if (!consent) return

        submitShopifyConsent({ consent, storefrontAccessToken })
      }}
    />
  )
}
