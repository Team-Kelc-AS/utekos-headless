// Path: src/app/layout.tsx

import '../globals.css'
import {
  googleSans,
  utekosText,
  utekosTextMedium
} from '@/app/fonts/font.config'
import { Suspense } from 'react'
import { mainMenu } from '@/db/config/menu.config'
import Footer from '@/components/footer/components/Footer'
import Header from '@/components/header/Header'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { OnlineStoreJsonLd } from './OnlineStoreJsonLd'
import { CartProviderLoader } from '@/components/providers/CartProviderLoader'
import { PageViewObserver } from '@/components/analytics/PageViewObserver'
import { ScrollDepthObserver } from '@/components/analytics/ScrollDepthObserver'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { SITE_URL } from '@/constants'
import type { Metadata } from 'next'
import type { TrackingEnvironment } from '@/lib/analytics/pageViewEvent'
import { resolveAssistantDeploymentRolloutPercent } from '@/lib/customer-assistant/assistantRollout'

const googleTagGatewayOrigin =
  (
    process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_URL
  ) ?
    `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV === 'development' ?
    'http://localhost:3000'
  : SITE_URL

const googleTagGatewayUrl = new URL(
  '/__gtg/gtm.js',
  googleTagGatewayOrigin
).toString()

function getTrackingEnvironment(): TrackingEnvironment {
  if (process.env.NODE_ENV === 'test') return 'test'
  if (process.env.VERCEL_ENV === 'production')
    return 'production'
  if (process.env.VERCEL_ENV === 'preview') return 'preview'
  return 'development'
}

export const metadata: Metadata = {
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  metadataBase: new URL('https://utekos.no'),
  title: {
    default: 'Utekos - Skreddersy varmen',
    template: '%s | Utekos'
  },
  description:
    'Utekos er en merkevare som designer funksjonelt yttertøy for kompromissløs komfort og overlegen allsidighet. Perfekt for hytteliv, bobilferie, telttur, i båt og terrasseliv.',
  alternates: { canonical: '/' },
  applicationName: 'Utekos',
  category: 'Yttertøy',
  manifest: '/manifest.webmanifest',
  authors: [{ name: 'Utekos', url: 'https://utekos.no' }],
  creator: 'Utekos',
  publisher: 'Utekos',
  formatDetection: {
    email: true,
    address: true,
    telephone: true
  },
  facebook: { appId: '1154247890253046' },
  pinterest: { richPin: true },
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
      url: 'https://utekos.no/og-kate-linn-kikkert-master.png',
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
        'e3q80hk1igl2celczeysvf7y1mltrs'
    }
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const assistantRolloutPercent =
    resolveAssistantDeploymentRolloutPercent(process.env)

  return (
    <html
      lang='no'
      translate='no'
      suppressHydrationWarning
      className={`${utekosText.variable} ${utekosTextMedium.variable} ${googleSans.variable}`}
    >
      <body className='scroll-smooth bg-background text-foreground antialiased dark:bg-background dark:text-foreground'>
        <GoogleTagManager
          gtmId='GTM-5TWMJQFP'
          gtmScriptUrl={googleTagGatewayUrl}
        />
        <Suspense fallback={null}>
          <PageViewObserver
            environment={getTrackingEnvironment()}
          />
          <ScrollDepthObserver />
        </Suspense>

        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          forcedTheme='dark'
          enableColorScheme
          disableTransitionOnChange
        >
          <OnlineStoreJsonLd />

          <Suspense fallback={null}>
            <CartProviderLoader>
              <SiteChrome
                assistantRolloutPercent={assistantRolloutPercent}
                header={<Header menu={mainMenu} />}
                footer={<Footer />}
              >
                {children}
              </SiteChrome>
            </CartProviderLoader>
          </Suspense>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
