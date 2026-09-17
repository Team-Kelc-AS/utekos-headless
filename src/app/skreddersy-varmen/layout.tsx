import './landing.css'
import { LandingCartButton } from './components/LandingCartButton'
import { Google_Sans_Flex } from 'next/font/google'
import { LandingTelemetry } from './components/LandingTelemetry'
import { siteMetadata } from '@/app/siteMetadata'
import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { Suspense, type ReactNode } from 'react'
import { SkreddersyVarmenJsonLd } from './structured-data/SkreddersyVarmenJsonLd'
import { resolveSkreddersyVarmenCommerce } from './data/resolveSkreddersyVarmenCommerce'
import { GoogleTagManagerNoScript } from '@/components/analytics/GoogleTagManagerNoScript'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'

async function SkreddersyVarmenStructuredData() {
  const commerce = await resolveSkreddersyVarmenCommerce()

  return commerce ?
      <SkreddersyVarmenJsonLd commerce={commerce} />
    : null
}

const landingFont = Google_Sans_Flex({
  subsets: ['latin'],
  weight: ['500', '800'],
  adjustFontFallback: false,
  display: 'swap',
  variable: '--landing-font',
  preload: true
})
export const metadata = siteMetadata

export default function LandingPageLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <html
      lang='no'
      translate='no'
      className={landingFont.variable}
    >
      <body>
        <GoogleTagManagerNoScript
          enabled={shouldLoadGoogleTagManager(
            process.env.VERCEL_ENV
          )}
        />
        <LandingTelemetry />
        <header className='landing-header' data-site-header>
          <a href='/' aria-label='Utekos – forsiden'>
            <UtekosWordmark />
          </a>
          <nav aria-label='Hovedmeny'>
            <a href='/produkter'>Produkter</a>
            <LandingCartButton />
          </nav>
        </header>
        <main>
          <Suspense fallback={null}>
            <SkreddersyVarmenStructuredData />
          </Suspense>
          {children}
        </main>
        <footer className='landing-footer'>
          <a href='/personvern'>Personvern</a>
          <a href='/frakt-og-retur'>Frakt og retur</a>
          <a href='/kontaktskjema'>Kontakt oss</a>
        </footer>
      </body>
    </html>
  )
}
