import { Suspense } from 'react'
import Script from 'next/script'
import { VercelTelemetry } from '@/components/analytics/VercelTelemetry'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { ScrollDepthObserver } from '@/components/analytics/ScrollDepthObserver'
import { JourneyObserver } from '@/components/analytics/JourneyObserver'
import { ShopifyCustomerPrivacyBridge } from '@/components/consent/ShopifyCustomerPrivacyBridge'
import { GoogleTagManagerLoader } from '@/components/analytics/GoogleTagManagerLoader'
import { ConsentGrantedScript } from '@/components/analytics/ConsentGrantedScript'
import { WebVitals } from '@/components/analytics/WebVitals'
import { MetaParameterBuilderInitializer } from '@/components/analytics/MetaParameterBuilderInitializer'
import { MetaBrowserTransportLoader } from '@/components/analytics/MetaBrowserTransportLoader'
import { getTrackingEnvironment } from '@/lib/analytics/getTrackingEnvironment'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'
import { resolveShopifyCustomerPrivacyPublicToken } from '@/lib/consent/resolveShopifyCustomerPrivacyPublicToken'

export function LandingTelemetry() {
  const shouldLoadMarketingScripts = shouldLoadGoogleTagManager(
    process.env.VERCEL_ENV
  )
  const pinterestTagId =
    process.env.NEXT_PUBLIC_PINTEREST_TAG_ID?.trim()
  const snapchatPixelEnabled =
    process.env.SNAPCHAT_PIXEL_ENABLED === 'true'
  const snapchatPixelId =
    process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID?.trim()
  const storefrontAccessToken =
    resolveShopifyCustomerPrivacyPublicToken(process.env)
  return (
    <>
      <Script
        id='utekos-consent-presentation'
        src='/consent/utekos-presentation.js'
        strategy='beforeInteractive'
      />
      <GoogleTagManagerLoader
        enabled={shouldLoadMarketingScripts}
      />
      {shouldLoadMarketingScripts ?
        <>
          <MetaBrowserTransportLoader />
          {pinterestTagId ?
            <ConsentGrantedScript
              id='pinterest-tag-canonical-browser'
              src='/analytics/pinterest-tag-canonical-v1.js'
              data-tag-id={pinterestTagId}
            />
          : null}
          {snapchatPixelEnabled && snapchatPixelId ?
            <ConsentGrantedScript
              id='snapchat-pixel-canonical-browser'
              src='/analytics/snapchat-pixel-canonical-v1.js'
              data-pixel-id={snapchatPixelId}
            />
          : null}
        </>
      : null}

      <Suspense fallback={null}>
        <MetaParameterBuilderInitializer />
        <PageViewObserver
          environment={getTrackingEnvironment()}
        />
        <ScrollDepthObserver />
        <JourneyObserver
          environment={getTrackingEnvironment()}
        />
      </Suspense>
      <WebVitals />

      <ShopifyCustomerPrivacyBridge
        storefrontAccessToken={storefrontAccessToken || ''}
      />
      <VercelTelemetry />
    </>
  )
}
