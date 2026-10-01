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

export function LandingTelemetry({
  deferMarketingScripts = false
}: {
  deferMarketingScripts?: boolean
}) {
  const shouldLoadMarketingScripts = shouldLoadGoogleTagManager(
    process.env.VERCEL_ENV
  )
  const storefrontAccessToken =
    resolveShopifyCustomerPrivacyPublicToken(process.env)
  return (
    <>
      <GoogleTagManagerLoader
        enabled={shouldLoadMarketingScripts}
        deferContainer={deferMarketingScripts}
      />
      <CanonicalBrowserProviderBridges
        enabled={shouldLoadMarketingScripts}
        deferUntilIdle={deferMarketingScripts}
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
