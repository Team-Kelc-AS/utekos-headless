// Path: src/app/(store)/layout.tsx

import '../../globals.css'
import { VercelTelemetry } from '@/components/analytics/VercelTelemetry'
import { Suspense } from 'react'
import { mainMenu } from '@/db/config/menu.config'
import Footer from '@/components/footer/components/Footer'
import Header from '@/components/header/Header'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { OnlineStoreJsonLd } from '@/app/OnlineStoreJsonLd'
import { CartProviderLoader } from '@/components/providers/CartProviderLoader'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { ScrollDepthObserver } from '@/components/analytics/ScrollDepthObserver'
import { JourneyObserver } from '@/components/analytics/JourneyObserver'
import { ShopifyCustomerPrivacyBridge } from '@/components/consent/ShopifyCustomerPrivacyBridge'
import { getTrackingEnvironment } from '@/lib/analytics/getTrackingEnvironment'
import { resolveAssistantDeploymentRolloutPercent } from '@/lib/customer-assistant/assistantRollout'
import { googleSansFlex } from '@/lib/fonts'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'
import { resolveShopifyCustomerPrivacyPublicToken } from '@/lib/consent/resolveShopifyCustomerPrivacyPublicToken'
import { GoogleTagManagerLoader } from '@/components/analytics/GoogleTagManagerLoader'
import { GoogleTagManagerNoScript } from '@/components/analytics/GoogleTagManagerNoScript'
import { CanonicalBrowserProviderBridges } from '@/components/analytics/CanonicalBrowserProviderBridges'
import { WebVitals } from '@/components/analytics/WebVitals'
import { MetaParameterBuilderInitializer } from '@/components/analytics/MetaParameterBuilderInitializer'

export { siteMetadata as metadata } from '@/app/siteMetadata'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const storefrontAccessToken =
    resolveShopifyCustomerPrivacyPublicToken(process.env)

  const assistantRolloutPercent =
    resolveAssistantDeploymentRolloutPercent(process.env)

  const shouldLoadMarketingScripts = shouldLoadGoogleTagManager(
    process.env.VERCEL_ENV
  )
  return (
    <html
      lang='no'
      translate='no'
      suppressHydrationWarning
      className={googleSansFlex.variable}
    >
      <body className='scroll-smooth bg-background text-foreground antialiased'>
        <GoogleTagManagerNoScript
          enabled={shouldLoadMarketingScripts}
        />
        <GoogleTagManagerLoader
          enabled={shouldLoadMarketingScripts}
        />
        <CanonicalBrowserProviderBridges
          enabled={shouldLoadMarketingScripts}
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

        <OnlineStoreJsonLd />

        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          forcedTheme='dark'
          disableTransitionOnChange
          enableColorScheme
        >
          <CartProviderLoader>
            <SiteChrome
              assistantRolloutPercent={assistantRolloutPercent}
              header={<Header menu={mainMenu} />}
              footer={<Footer />}
            >
              {children}
            </SiteChrome>
          </CartProviderLoader>
        </ThemeProvider>

        <ShopifyCustomerPrivacyBridge
          storefrontAccessToken={storefrontAccessToken || ''}
        />
        <VercelTelemetry />
      </body>
    </html>
  )
}
