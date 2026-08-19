// Path: src/app/layout.tsx

import '../globals.css'
import {
  utekosText,
  utekosTextMedium
} from '@/app/fonts/font.config'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Suspense } from 'react'
import { mainMenu } from '@/db/config/menu.config'
import Footer from '@/components/footer/components/Footer'
import Header from '@/components/header/Header'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { OnlineStoreJsonLd } from './OnlineStoreJsonLd'
import { CartProviderLoader } from '@/components/providers/CartProviderLoader'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { ScrollDepthObserver } from '@/components/analytics/ScrollDepthObserver'
import { ShopifyCustomerPrivacyBridge } from '@/components/consent/ShopifyCustomerPrivacyBridge'
import Script from 'next/script'
import type { Metadata } from 'next'
import { getTrackingEnvironment } from '@/lib/analytics/getTrackingEnvironment'
import { resolveAssistantPreviewRolloutPercent } from '@/lib/customer-assistant/assistantRollout'
import { Google_Sans_Flex } from 'next/font/google'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'
import { resolveShopifyCustomerPrivacyPublicToken } from '@/lib/consent/resolveShopifyCustomerPrivacyPublicToken'
import { GoogleTagManagerLoader } from '@/components/analytics/GoogleTagManagerLoader'
import { WebVitals } from '@/components/analytics/WebVitals'

const googleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  preload: false,
  fallback: ['Geist', 'system-ui', 'sans-serif']
})

export const metadata: Metadata = {
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png'
  },
  metadataBase: new URL(
    'https://utekos.no'
  ),
  title: 'Utekos - Skreddersy varmen',
  description:
    'Utekos er en merkevare som designer funksjonelt yttertøy for kompromissløs komfort og overlegen allsidighet. Perfekt for hytteliv, bobilferie, telttur, i båt og terrasseliv.',
  alternates: {
    canonical: '/'
  },
  applicationName: 'Utekos',
  category: 'Yttertøy',
  manifest: '/manifest.webmanifest',
  authors: [
    {
      name: 'Utekos',
      url: 'https://utekos.no'
    }
  ],
  creator: 'Utekos',
  publisher: 'Utekos',
  formatDetection: {
    email: true,
    address: true,
    telephone: true
  },
  facebook: {
    appId: '1154247890253046'
  },
  pinterest: {
    richPin: true
  },
  appleWebApp: {
    capable: true,
    title: 'Utekos',
    statusBarStyle: 'default'
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: 'https://utekos.no',
    siteName: 'Utekos',
    title: 'Utekos - Skreddersy varmen',
    description:
      'Utekos er en merkevare som designer funksjonelt yttertøy for kompromissløs komfort og overlegen allsidighet. Perfekt for hytteliv, bobilferie, telttur, i båt og terrasseliv.',
    images: {
      url: 'https://utekos.no/og-utekos_brand.jpg',
      width: 1200,
      height: 630,
      alt: 'To kvinner som koser seg utendørs på terrassen med varme komfortplagg fra Utekos.'
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'index': true,
      'follow': true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  verification: {
    other: {
      'facebook-domain-verification':
        'e3q80hk1igl2celczeysvf7y1mltrs',
      'p:domain_verify':
        'edb3d2ffc77d9930280b515c685c5e13'
    }
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const storefrontAccessToken =
    resolveShopifyCustomerPrivacyPublicToken(process.env)

  const assistantRolloutPercent =
    resolveAssistantPreviewRolloutPercent(
      process.env
    )

  const shouldLoadMarketingScripts =
    shouldLoadGoogleTagManager(
      process.env.VERCEL_ENV
    )
  const pinterestTagId =
    process.env.NEXT_PUBLIC_PINTEREST_TAG_ID?.trim()

  return (
    <html
      lang='no'
      translate='no'
      suppressHydrationWarning
      className={`${utekosText.variable} ${utekosTextMedium.variable} ${googleSansFlex.variable}`}
    >
      <GoogleTagManagerLoader
        enabled={shouldLoadMarketingScripts}
      />

      <body className='scroll-smooth bg-background text-foreground antialiased dark:bg-background dark:text-foreground'>
        {shouldLoadMarketingScripts ?
          <>
            <Script
              id='meta-pixel-canonical-browser'
              src='/analytics/meta-pixel-canonical-v1.js'
              strategy='afterInteractive'
            />
            {pinterestTagId ?
              <Script
                id='pinterest-tag-canonical-browser'
                src='/analytics/pinterest-tag-canonical-v1.js'
                strategy='afterInteractive'
                data-tag-id={pinterestTagId}
              />
            : null}
          </>
        : null}

        <Suspense fallback={null}>
          <PageViewObserver
            environment={
              getTrackingEnvironment()
            }
          />
          <ScrollDepthObserver />
        </Suspense>
        <WebVitals />

        <OnlineStoreJsonLd />

        <CartProviderLoader>
          <SiteChrome
            assistantRolloutPercent={
              assistantRolloutPercent
            }
            header={
              <Header menu={mainMenu} />
            }
            footer={<Footer />}
          >
            {children}
          </SiteChrome>
        </CartProviderLoader>

        <ShopifyCustomerPrivacyBridge
         storefrontAccessToken={storefrontAccessToken || ''}
          />
        <Analytics mode="production" />
         <SpeedInsights />
      </body>
    </html>
  )
}
