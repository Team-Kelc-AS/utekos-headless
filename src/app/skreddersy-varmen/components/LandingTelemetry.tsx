import { Suspense } from 'react'
import { VercelTelemetry } from '@/components/analytics/VercelTelemetry'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { ScrollDepthObserver } from '@/components/analytics/ScrollDepthObserver'
import { JourneyObserver } from '@/components/analytics/JourneyObserver'
import { ShopifyCustomerPrivacyBridge } from '@/components/consent/ShopifyCustomerPrivacyBridge'
import { GoogleTagManagerLoader } from '@/components/analytics/GoogleTagManagerLoader'
import { CanonicalBrowserProviderBridges } from '@/components/analytics/CanonicalBrowserProviderBridges'
import { WebVitals } from '@/components/analytics/WebVitals'
import { MetaParameterBuilderInitializer } from '@/components/analytics/MetaParameterBuilderInitializer'
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
      <GoogleTagManagerLoader
        enabled={shouldLoadMarketingScripts}
      />
      <CanonicalBrowserProviderBridges
        enabled={shouldLoadMarketingScripts}
        pinterestTagId={pinterestTagId}
        snapchatPixelEnabled={snapchatPixelEnabled}
        snapchatPixelId={snapchatPixelId}
      />

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
