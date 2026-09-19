'use client'

import Script from 'next/script'

const SHOPIFY_CUSTOMER_PRIVACY_SRC =
  'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js'

type ShopifyTrackingAuthorization = {
  analytics: boolean
  marketing: boolean
  preferences: boolean
  headlessStorefront: true
  checkoutRootDomain: 'kasse.utekos.no'
  storefrontRootDomain: 'utekos.no'
  storefrontAccessToken: string
}

type ShopifyCustomerPrivacyApi = {
  setTrackingConsent: (
    consent: ShopifyTrackingAuthorization,
    callback: (error?: unknown) => void
  ) => void
}

type PrivacyBridgeWindow = Window & {
  Shopify?: { customerPrivacy?: ShopifyCustomerPrivacyApi }
}

function submitShopifyConsent({
  storefrontAccessToken
}: {
  storefrontAccessToken: string
}): void {
  const api = (window as PrivacyBridgeWindow).Shopify
    ?.customerPrivacy
  if (!api) return

  api.setTrackingConsent(
    {
      analytics: true,
      marketing: true,
      preferences: true,
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
  if (!storefrontAccessToken) return null

  return (
    <Script
      id='shopify-customer-privacy-api'
      src={SHOPIFY_CUSTOMER_PRIVACY_SRC}
      strategy='afterInteractive'
      onLoad={() => {
        submitShopifyConsent({ storefrontAccessToken })
      }}
    />
  )
}
