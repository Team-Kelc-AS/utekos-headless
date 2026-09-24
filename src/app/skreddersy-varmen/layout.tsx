import './landing.css'
import { LandingCartButton } from './components/LandingCartButton'
import { googleSansFlex } from '@/lib/fonts'
import { LandingTelemetry } from './components/LandingTelemetry'
import { siteMetadata } from '@/app/siteMetadata'
import { Suspense, type ReactNode } from 'react'
import Image from 'next/image'
import { mainMenu } from '@/db/config/menu.config'
import { SkreddersyVarmenJsonLd } from './structured-data/SkreddersyVarmenJsonLd'
import { resolveSkreddersyVarmenCommerce } from './data/resolveSkreddersyVarmenCommerce'
import { GoogleTagManagerNoScript } from '@/components/analytics/GoogleTagManagerNoScript'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'
import { ClientMobileMenu } from '@/components/header/ClientMobileMenu'

async function SkreddersyVarmenStructuredData() {
  const commerce = await resolveSkreddersyVarmenCommerce()

  return commerce ?
      <SkreddersyVarmenJsonLd commerce={commerce} />
    : null
}

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
      suppressHydrationWarning
      className={googleSansFlex.variable}
    >
      <body>
        <GoogleTagManagerNoScript
          enabled={shouldLoadGoogleTagManager(
            process.env.VERCEL_ENV
          )}
        />
        <LandingTelemetry />
        <header className='landing-header' data-site-header>
          <a
            href='/'
            aria-label='Utekos – forsiden'
            className='landing-header-brand'
          >
            <Image
              src='/IconWhite.svg'
              alt=''
              width={1280}
              height={1109}
              className='size-9'
              priority
            />
          </a>
          <nav aria-label='Hovedmeny'>
            <LandingCartButton className='landing-header-action' />
            <ClientMobileMenu menu={mainMenu} iconOnly />
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
