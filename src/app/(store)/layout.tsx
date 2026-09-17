// Path: src/app/(store)/layout.tsx

import '../../globals.css'
import {
  utekosText,
  utekosTextMedium
} from '@/app/fonts/font.config'
import { VercelTelemetry } from '@/components/analytics/VercelTelemetry'
import { Suspense } from 'react'
import { mainMenu } from '@/db/config/menu.config'
import Footer from '@/components/footer/components/Footer'
import Header from '@/components/header/Header'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { OnlineStoreJsonLd } from '@/app/OnlineStoreJsonLd'
import { CartProviderLoader } from '@/components/providers/CartProviderLoader'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { ScrollDepthObserver } from '@/components/analytics/ScrollDepthObserver'
import { JourneyObserver } from '@/components/analytics/JourneyObserver'
import { ConsentPresentationBridge } from '@/components/consent/ConsentPresentationBridge'
import { ShopifyCustomerPrivacyBridge } from '@/components/consent/ShopifyCustomerPrivacyBridge'
import Script from 'next/script'
import { getTrackingEnvironment } from '@/lib/analytics/getTrackingEnvironment'
import { resolveAssistantDeploymentRolloutPercent } from '@/lib/customer-assistant/assistantRollout'
import { Google_Sans_Flex } from 'next/font/google'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'
import { resolveShopifyCustomerPrivacyPublicToken } from '@/lib/consent/resolveShopifyCustomerPrivacyPublicToken'
import { GoogleTagManagerLoader } from '@/components/analytics/GoogleTagManagerLoader'
import { GoogleTagManagerNoScript } from '@/components/analytics/GoogleTagManagerNoScript'
import { ConsentGrantedScript } from '@/components/analytics/ConsentGrantedScript'
import { WebVitals } from '@/components/analytics/WebVitals'
import { MetaParameterBuilderInitializer } from '@/components/analytics/MetaParameterBuilderInitializer'
import { MetaBrowserTransportLoader } from '@/components/analytics/MetaBrowserTransportLoader'
import {
  isFacebookLoginEnabled,
  isFacebookLoginPreviewAllowed,
  readFacebookLoginClientConfig
} from '@/lib/facebook-login/facebookLoginConfig'

const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  fallback: ['Geist', 'system-ui', 'sans-serif']
})

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
  const pinterestTagId =
    process.env.NEXT_PUBLIC_PINTEREST_TAG_ID?.trim()
  const snapchatPixelEnabled =
    process.env.SNAPCHAT_PIXEL_ENABLED === 'true'
  const snapchatPixelId =
    process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID?.trim()
  const facebookLoginEnabled = isFacebookLoginEnabled(
    process.env
  )
  const facebookLoginClientConfig =
    readFacebookLoginClientConfig(process.env)
  const facebookLoginPreviewAllowed =
    isFacebookLoginPreviewAllowed(process.env)
  return (
    <html
      lang='no'
      translate='no'
      suppressHydrationWarning
      className={`${utekosText.variable} ${utekosTextMedium.variable} ${googleSansFlex.variable}`}
    >
      <body className='scroll-smooth bg-background text-foreground antialiased'>
        <GoogleTagManagerNoScript
          enabled={shouldLoadMarketingScripts}
        />
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

        <OnlineStoreJsonLd />

        <CartProviderLoader>
          <SiteChrome
            assistantRolloutPercent={assistantRolloutPercent}
            facebookLoginEnabled={facebookLoginEnabled}
            facebookLoginClientConfig={facebookLoginClientConfig}
            facebookLoginPreviewAllowed={
              facebookLoginPreviewAllowed
            }
            header={<Header menu={mainMenu} />}
            footer={<Footer />}
          >
            {children}
          </SiteChrome>
        </CartProviderLoader>

        <ShopifyCustomerPrivacyBridge
          storefrontAccessToken={storefrontAccessToken || ''}
        />
        <Suspense fallback={null}>
          <ConsentPresentationBridge />
        </Suspense>
        <VercelTelemetry />
      </body>
    </html>
  )
}
