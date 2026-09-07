# Shared shell and help-page layouts

Snapshot of existing working tree; instrumentation is context only and excluded from visual payloads.

## `src/app/layout.tsx`

```tsx
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
import { JourneyObserver } from '@/components/analytics/JourneyObserver'
import { ShopifyCustomerPrivacyBridge } from '@/components/consent/ShopifyCustomerPrivacyBridge'
import Script from 'next/script'
import type { Metadata } from 'next'
import { getTrackingEnvironment } from '@/lib/analytics/getTrackingEnvironment'
import { resolveAssistantDeploymentRolloutPercent } from '@/lib/customer-assistant/assistantRollout'
import { Google_Sans_Flex } from 'next/font/google'
import { shouldLoadGoogleTagManager } from '@/lib/analytics/shouldLoadGoogleTagManager'
import { resolveShopifyCustomerPrivacyPublicToken } from '@/lib/consent/resolveShopifyCustomerPrivacyPublicToken'
import { GoogleTagManagerLoader } from '@/components/analytics/GoogleTagManagerLoader'
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
  preload: false,
  fallback: ['Geist', 'system-ui', 'sans-serif']
})

export const metadata: Metadata = {
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
  metadataBase: new URL('https://utekos.no'),
  title: 'Utekos - Skreddersy varmen',
  description:
    'Utekos er en merkevare som designer yttertøy som kan justeres og formes etter behov. Opplev ompromissløs komfort og overlegen allsidighet. Perfekt for hytte, bobil, camping og terrasseliv.',
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
      'Utekos er en merkevare som designer yttertøy som kan justeres og formes etter behov. Opplev kompromissløs komfort og overlegen allsidighet. Perfekt for hytteliv, bobil, båt og terrasseliv.',
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
      'p:domain_verify': 'edb3d2ffc77d9930280b515c685c5e13'
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
      <GoogleTagManagerLoader
        enabled={shouldLoadMarketingScripts}
      />

      <body className='scroll-smooth bg-background text-foreground antialiased'>
        {shouldLoadMarketingScripts ?
          <>
            <MetaBrowserTransportLoader />
            {pinterestTagId ?
              <Script
                id='pinterest-tag-canonical-browser'
                src='/analytics/pinterest-tag-canonical-v1.js'
                strategy='afterInteractive'
                data-tag-id={pinterestTagId}
              />
            : null}
            {snapchatPixelEnabled && snapchatPixelId ?
              <Script
                id='snapchat-pixel-canonical-browser'
                src='/analytics/snapchat-pixel-canonical-v1.js'
                strategy='afterInteractive'
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
        <Analytics mode='production' />
        <SpeedInsights />
      </body>
    </html>
  )
}

```

## `src/components/layout/SiteChrome.tsx`

```tsx
'use client'

import {
  isAssistantExcludedPathname,
  resolveAssistantClientExposure,
  resolveAssistantProductHandle,
  type AssistantExposure
} from '@/lib/customer-assistant/assistantRollout'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

import {
  NEWSLETTER_MODAL_ENABLED,
  isNewsletterModalExcludedPath
} from '@/components/newsletter-modal/newsletterModalConfig'

import { NavigationProgress } from './NavigationProgress'
import { FacebookLoginPrompt } from '@/components/facebook-login/FacebookLoginPrompt'
import type { FacebookLoginClientConfig } from '@/lib/facebook-login/facebookLoginConfig'

const NewsletterSignupDialog = dynamic(
  () =>
    import('@/components/newsletter-modal/NewsletterSignupDialog').then(
      module => module.NewsletterSignupDialog
    ),
  { ssr: false }
)

const CustomerAssistant = dynamic(
  () =>
    import('@/components/customer-assistant/CustomerAssistant').then(
      module => module.CustomerAssistant
    ),
  { ssr: false }
)

type SiteChromeProps = {
  assistantRolloutPercent: number
  children: React.ReactNode
  facebookLoginEnabled: boolean
  facebookLoginClientConfig:
    | FacebookLoginClientConfig
    | undefined
  facebookLoginPreviewAllowed: boolean
  header: React.ReactNode
  footer: React.ReactNode
}

function isDesignRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false
  }

  return (
    pathname === '/design' || pathname.startsWith('/design/')
  )
}

function AssistantRolloutMount({
  memoryBucketRef,
  pathname,
  rolloutPercent
}: {
  memoryBucketRef: { current: number | null }
  pathname: string | null
  rolloutPercent: number
}) {
  const [exposure, setExposure] =
    useState<AssistantExposure>('holdout')

  useEffect(() => {
    let storage: Storage | null = null

    try {
      storage = window.localStorage
    } catch {}

    const nextExposure = resolveAssistantClientExposure(
      rolloutPercent,
      storage,
      () => {
        memoryBucketRef.current ??= Math.random()
        return memoryBucketRef.current
      }
    )
    const syncTimer = window.setTimeout(
      () => setExposure(nextExposure),
      0
    )

    return () => window.clearTimeout(syncTimer)
  }, [memoryBucketRef, rolloutPercent])

  if (exposure !== 'assistant') return null

  return (
    <CustomerAssistant
      rolloutPercent={rolloutPercent}
      productHandle={resolveAssistantProductHandle(pathname)}
    />
  )
}

export function SiteChrome({
  assistantRolloutPercent,
  children,
  facebookLoginEnabled,
  facebookLoginClientConfig,
  facebookLoginPreviewAllowed,
  header,
  footer
}: SiteChromeProps) {
  const pathname = usePathname()
  const assistantMemoryBucketRef = useRef<number | null>(null)

  if (isDesignRoute(pathname)) {
    return children
  }

  const showNewsletterModal =
    NEWSLETTER_MODAL_ENABLED &&
    !isNewsletterModalExcludedPath(pathname)

  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {showNewsletterModal ?
        <NewsletterSignupDialog />
      : null}

      <FacebookLoginPrompt
        enabled={facebookLoginEnabled}
        clientConfig={facebookLoginClientConfig}
        previewAllowed={facebookLoginPreviewAllowed}
      />

      {header}

      <main>{children}</main>

      {footer}

      {assistantRolloutPercent > 0 &&
        !isAssistantExcludedPathname(pathname) && (
          <AssistantRolloutMount
            memoryBucketRef={assistantMemoryBucketRef}
            pathname={pathname}
            rolloutPercent={assistantRolloutPercent}
          />
        )}
    </>
  )
}

```

## `src/components/header/Header.tsx`

```tsx
// Path: src/components/header/Header.tsx

import { Cart } from '@/components/cart/Cart'
import { HeaderSearch } from '@/components/header/HeaderSearch/HeaderSearch'
import type { MenuItem } from '@types'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { HeadphonesIcon } from 'lucide-react'
import { ClientMobileMenu } from './ClientMobileMenu'
import wordmarkwhite from '@/assets/images/brand/WordmarkWhite.svg'

export default function Header({
  menu
}: {
  menu: MenuItem[]
}) {
  return (
    <header
      data-site-header
      className='top-0! z-50 bg-night w-full text-foreground'
    >
      <div className='relative mx-auto grid min-h-18 w-full grid-cols-[auto_1fr] items-center gap-3 px-4 py-2.5 sm:px-6 lg:min-h-20 lg:px-10 xl:min-h-22.5'>
        <div
          data-header-part='brand'
          className='flex min-w-0 items-center justify-start'
        >
          <Link
            href={'/' as Route}
            aria-label='Utekos - Til forsiden'
            data-track='HeaderLogoClick'
            className='flex h-14 items-center pl-2 lg:h-16'
          >
            <Image
              src='/IconWhite.svg'
              alt=''
              width={1280}
              height={1109}
              loading='eager'
              fetchPriority='high'
              className='h-8 w-auto sm:hidden'
            />
            <Image
              src={wordmarkwhite}
              alt=''
              width={300}
              height={73}
              loading='eager'
              fetchPriority='high'
              className='hidden h-7 w-auto sm:block sm:h-8 lg:h-9 xl:h-10'
            />
          </Link>
        </div>

        <div
          data-header-part='actions'
          className='flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 lg:gap-3'
        >
          <HeaderSearch variant='nav' />

          <Link
            href={'/kontaktskjema' as Route}
            data-track='HeaderCustomerServiceClick'
            className='hidden h-11 min-w-31 items-center justify-center gap-2 rounded-md px-3 font-utekos-text-medium text-sm text-foreground transition outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring md:inline-flex'
          >
            <HeadphonesIcon
              className='size-4'
              aria-hidden
            />
            <span>Kundeservice</span>
          </Link>

          <Cart
            showLabel
            className='h-11 min-w-11 rounded-md border-transparent bg-transparent px-0 text-foreground hover:bg-accent hover:text-accent-foreground md:min-w-29 md:px-3'
          />

          <ClientMobileMenu menu={menu} />
        </div>
      </div>
    </header>
  )
}

```

## `src/components/footer/components/Footer.tsx`

```tsx
import { CopyrightNotice } from '@/components/footer/components/CopyrightNotice'
import { FooterNavigation } from '@/components/footer/components/FooterNavigation'
import { PaymentMethods } from '@/components/footer/components/PaymentMethods'
import { ConditionalNewsLetter } from '@/components/footer/components/ConditionalNewsletter'

export default function Footer() {
  return (
    <footer className='mt-auto border-t border-border pt-12 pb-4 font-utekos-text text-foreground'>
      <div className='container mx-auto px-4 sm:px-8'>
        <FooterNavigation />
        <ConditionalNewsLetter />
        <PaymentMethods />
        <CopyrightNotice />
      </div>
    </footer>
  )
}

```

## `src/components/footer/components/FooterNavigation.tsx`

```tsx
// Path: src/components/footer/FooterNavigation.tsx
import { footerConfig } from '@/db/config/footer.config'
import Link from 'next/link'

export function FooterNavigation() {
  return (
    <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
      {footerConfig.map(section => (
        <div key={section.title}>
          <h3 className='mb-4 font-utekos-text-medium text-lg'>
            {section.title}
          </h3>
          <nav aria-label={`${section.title} navigasjon`}>
            <ul className='space-y-2'>
              {section.links.map(link => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className='font-utekos-text text-base transition-colors hover:text-foreground'
                    {...(link.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer'
                    })}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ))}
    </div>
  )
}

```

## `src/components/footer/components/PaymentMethods.tsx`

```tsx
const PAY_ICONS_MOBILE =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsMobile.webp?v=1784837536'
const PAY_ICONS_IPAD =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsIpad.webp?v=1784837673'
const PAY_ICONS_DESKTOP =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/FooterPayIcons.webp?v=1784837537'

const ALT =
  'Betalingsmetoder: Klarna, Vipps, Visa og Mastercard'

export function PaymentMethods() {
  return (
    <div className='mt-12 border-t border-border pt-8'>
      <picture className='mx-auto block w-full max-w-5xl'>
        <source
          media='(min-width: 1024px)'
          srcSet={PAY_ICONS_DESKTOP}
        />
        <source
          media='(min-width: 768px)'
          srcSet={PAY_ICONS_IPAD}
        />
        <img
          src={PAY_ICONS_MOBILE}
          alt={ALT}
          width={390}
          height={50}
          className='mx-auto h-auto w-full max-w-5xl'
        />
      </picture>
    </div>
  )
}

```

## `src/components/footer/components/CopyrightNotice.tsx`

```tsx
// Path: src/components/footer/CopyrightNotice.tsx
const { COMPANY_NAME, SITE_NAME } = process.env
const COPYRIGHT_YEAR = '2026'

export function CopyrightNotice() {
  const copyrightName = COMPANY_NAME || SITE_NAME || ''
  const copyrightText = `${copyrightName}${
    copyrightName.length > 0 && !copyrightName.endsWith('.') ? '.' : ''
  }`

  return (
    <div className='mt-8 text-center'>
      <p className='text-xs font-utekos-text'>
        &copy; {COPYRIGHT_YEAR} {copyrightText} Alle rettigheter forbeholdt. Utekos® er et registrert varemerke
        i Norge.
      </p>
    </div>
  )
}

```

## `src/components/navigation/UtekosBreadcrumbBar.tsx`

```tsx
import Link from 'next/link'
import type { Route } from 'next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  breadcrumbSurfaceStyles,
  isEmbeddedSurface,
  type BreadcrumbNavItem,
  type BreadcrumbSurface
} from '@/lib/navigation/breadcrumbVariants'
import { cn } from '@/lib/utils/className'

type UtekosBreadcrumbBarProps = {
  items: BreadcrumbNavItem[]
  surface: BreadcrumbSurface
  className?: string
  containerClassName?: string
  listClassName?: string
  embedded?: boolean
}

export function UtekosBreadcrumbBar({
  items,
  surface,
  className,
  containerClassName,
  listClassName,
  embedded
}: UtekosBreadcrumbBarProps) {
  const styles = breadcrumbSurfaceStyles[surface]
  const stripeless = isEmbeddedSurface(surface)
  const showColoredStripe =
    !embedded && !stripeless && Boolean(styles.stripe)

  const breadcrumb = (
    <Breadcrumb className={className}>
      <BreadcrumbList className={cn(styles.list, listClassName)}>
        {items.flatMap((item, index) => {
          const isLast = index === items.length - 1
          const nodes: React.ReactNode[] = []

          if (index > 0) {
            nodes.push(
              <BreadcrumbSeparator
                key={`breadcrumb-separator-${item.label}`}
                className={styles.separator}
              />
            )
          }

          nodes.push(
            <BreadcrumbItem
              key={`breadcrumb-item-${item.label}`}
            >
              {isLast || !item.href ?
                <BreadcrumbPage className={styles.page}>
                  {item.label}
                </BreadcrumbPage>
              : <BreadcrumbLink
                  className={styles.link}
                  render={<Link href={item.href as Route} />}
                >
                  {item.label}
                </BreadcrumbLink>
              }
            </BreadcrumbItem>
          )

          return nodes
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )

  if (embedded) {
    return breadcrumb
  }

  if (showColoredStripe) {
    return (
      <article className={cn('w-full', styles.stripe)}>
        <div
          className={cn(
            'container mx-auto w-full px-4 py-5',
            containerClassName
          )}
        >
          {breadcrumb}
        </div>
      </article>
    )
  }

  return (
    <div
      className={cn(
        'container mx-auto w-full px-4 py-5',
        containerClassName
      )}
    >
      {breadcrumb}
    </div>
  )
}

```

## `src/lib/navigation/breadcrumbVariants.ts`

```tsx
/**
 * Breadcrumb surface tokens — WCAG 2.2 AAA-oriented pairs.
 *
 * Verified pairs (approximate, from design tokens):
 * - light:    fg #f0eee9 on bg #010214  → ~15.8:1 (1.4.3 AAA)
 * - dark:     fg #f0eee9 on bg #010214  → ~15.8:1 (1.4.3 AAA)
 * - inverted: fg #010214 on bg #f0eee9  → ~15.8:1 (1.4.3 AAA)
 * - transparent: inherits parent `color`; contrast is the parent’s responsibility.
 *
 * Link opacities use /85 (not /72) to preserve ≥7:1 on muted states.
 * Separators use /55 — non-text UI, ≥3:1 vs adjacent (1.4.11 AA).
 * light surface hover uses ceramic (not primary): primary on dark bg ≈3.85:1 (fails 1.4.3 normal text).
 */

export type BreadcrumbSurface =
  | 'light'
  | 'dark'
  | 'inverted'
  | 'transparent'
  | 'transparentDark'
  | 'embeddedLight'
  | 'embeddedDark'

export type BreadcrumbNavItem = { label: string; href?: string }

export type BreadcrumbSurfaceStyles = {
  stripe: string
  list: string
  link: string
  page: string
  separator: string
}

const lightText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-border  bg-background text-foreground',
  list: 'text-foreground',
  link: 'text-foreground/85 transition-colors hover:text-ceramic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceramic/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  page: 'font-medium text-foreground',
  separator:
    'text-foreground/55 [&>svg]:text-foreground/55'
}

const darkText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-background/12 bg-foreground text-background',
  list: 'text-background',
  link: 'text-background/85 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
  page: 'font-medium text-background',
  separator:
    'text-background/55 [&>svg]:text-background/55'
}

const invertedText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-background/12 bg-foreground text-background',
  list: 'text-background',
  link: 'text-background/85 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
  page: 'font-medium text-background',
  separator:
    'text-background/55 [&>svg]:text-background/55'
}

const transparentText: BreadcrumbSurfaceStyles = {
  stripe: '',
  list: 'text-inherit',
  link: 'text-inherit/85 transition-colors hover:text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50 focus-visible:ring-offset-2',
  page: 'font-medium text-inherit',
  separator: 'text-inherit/55 [&>svg]:text-inherit/55'
}

export const breadcrumbSurfaceStyles: Record<
  BreadcrumbSurface,
  BreadcrumbSurfaceStyles
> = {
  light: lightText,
  dark: darkText,
  inverted: invertedText,
  transparent: transparentText,
  /** @deprecated Use `transparent` — kept for backward compatibility. */
  transparentDark: transparentText,
  /** @deprecated Use `transparent` with parent text color. */
  embeddedLight: { ...lightText, stripe: '' },
  /** @deprecated Use `transparent` with parent text color. */
  embeddedDark: { ...darkText, stripe: '' }
}

export function isEmbeddedSurface(
  surface: BreadcrumbSurface
): boolean {
  return breadcrumbSurfaceStyles[surface].stripe === ''
}

```

## `src/db/config/footer.config.ts`

```tsx
// Path: src/config/footer.config.ts
import type { Route } from 'next'
import type { FooterSection } from '@types'

export const footerConfig: FooterSection[] = [
  {
    title: 'Handlehjelp',
    links: [
      {
        title: 'Kontakt oss',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterContactClick'
      },
      {
        title: 'Teknologi og materialer',
        path: '/handlehjelp/teknologi-materialer' as Route,
        trackingEvent: 'FooterTechMaterialsClick'
      },
      {
        title: 'Vask og vedlikehold',
        path: '/handlehjelp/vask-og-vedlikehold' as Route,
        trackingEvent: 'FooterWashMaintenanceClick'
      },
      {
        title: 'Størrelses­guide',
        path: '/handlehjelp/storrelsesguide' as Route,
        trackingEvent: 'FooterSizeGuideClick'
      }
    ]
  },
  {
    title: 'Kundeservice',
    links: [
      {
        title: 'Kundeservice',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterCustomerServicePageClick'
      },
      {
        title: 'Tlf: +47 40 21 63 43',
        path: 'tel:+4740216343' as Route,
        external: true,
        trackingEvent: 'FooterPhoneClick'
      },
      {
        title: 'E-post: kundeservice@utekos.no',
        path: 'mailto:kundeservice@utekos.no' as Route,
        external: true,
        trackingEvent: 'FooterEmailClick'
      }
    ]
  },
  {
    title: 'Informasjon',
    links: [
      {
        title: 'Om oss',
        path: '/om-oss' as Route,
        trackingEvent: 'FooterAboutUsClick'
      },
      {
        title: 'Frakt og retur',
        path: '/frakt-og-retur' as Route,
        trackingEvent: 'FooterShippingReturnClick'
      },
      {
        title: 'Personvern',
        path: '/personvern' as Route,
        trackingEvent: 'FooterPrivacyClick'
      },
      {
        title: 'Vilkår og betingelser',
        path: '/vilkar-betingelser' as Route,
        trackingEvent: 'FooterTermsConditionsClick'
      }
    ]
  },
  {
    title: 'Bedriftsinformasjon',
    links: [
      {
        title: 'KELC AS',
        path: '/' as Route,
        trackingEvent: 'FooterKelcAsClick'
      },
      {
        title: 'Lille Damsgårdsveien 25',
        path: 'map:Lille Damsgårdsveien 25' as Route,
        external: true,
        trackingEvent: 'FooterAddressClick'
      },
      {
        title: '5162, Laksevåg',
        path: 'map:Lille Damsgårdsveien 25, 5162, Bergen' as Route,
        external: true,
        trackingEvent: 'FooterCityClick'
      },
      {
        title: 'Org.nr 925 820 393',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterOrgNrClick'
      }
    ]
  }
]

```

## `src/db/config/menu.config.ts`

```tsx
// Path: src/db/config/menu.config.ts
import type { MenuItem } from '@types'

export const mainMenu: MenuItem[] = [
  {
    title: 'Handle nå',
    url: '/produkter',
    items: [
      {
        title: 'Utekos Mikrofiber™',
        url: '/produkter/utekos-mikrofiber',
        items: []
      },
      { title: 'Utekos Dun™', url: '/produkter/utekos-dun', items: [] },
      { title: 'Comfyrobe™', url: '/produkter/comfyrobe', items: [] },
      {
        title: 'Utekos TechDown™',
        url: '/produkter/utekos-techdown',
        items: []
      },
      {
        title: 'Utekos Stapper™',
        url: '/produkter/utekos-stapper',
        items: []
      },
      { title: 'Se alle produkter', url: '/produkter', items: [] }
    ]
  },
  {
    title: 'Om Utekos',
    url: '/om-oss',
    items: [
      { title: 'Om Utekos', url: '/om-oss', items: [] },
      { title: 'Kontakt oss', url: '/kontaktskjema', items: [] }
    ]
  },
  {
    title: 'Inspirasjon',
    url: '/inspirasjon',
    items: [
      { title: 'Hytteliv', url: '/inspirasjon/hytte', items: [] },
      { title: 'Bobil og camping', url: '/inspirasjon/bobil', items: [] },
      { title: 'Båtliv', url: '/inspirasjon/batliv', items: [] },
      { title: 'Terrassen', url: '/inspirasjon/terrassen', items: [] },
      { title: 'Grillkvelden', url: '/inspirasjon/grillkvelden', items: [] },
      { title: 'Skreddersy varmen', url: '/skreddersy-varmen', items: [] }
    ]
  },
  {
    title: 'Magasinet',
    url: '/magasinet',
    items: []
  }
]

```
