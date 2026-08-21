import { Suspense } from 'react'
import { DeferredLandingSections } from '@/app/skreddersy-varmen/components/DeferredLandingSections'
import { HeroAndEmpathy } from './components/HeroEmpathy'
import { LandingPurchaseFallback } from './components/LandingPurchaseFallback'
import { LandingPurchaseSection } from './components/LandingPurchaseSection'
import { MetaWebsiteHighlights } from './components/MetaWebsiteHighlights'
import { StickyMobileAction } from './components/StickyMobileAction'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { PreFooterNavigation } from './components/PreFooterNavigation'
import { SkreddersyVarmenBreadcrumbs } from './components/SkreddersyVarmenBreadcrumbs'
import { SkreddersyVarmenKlarnaStrip } from './components/SkreddersyVarmenKlarnaStrip'
import { SectionSocialProof } from './components/SectionSocialProof'
import { LandingFaq } from './components/LandingFaq'
import { LandingKlarnaPromotion } from './components/LandingKlarnaPromotion'
import {
  LANDING_PAGE_DESCRIPTION,
  LANDING_PAGE_TITLE,
  LANDING_PAGE_URL,
  LANDING_SOCIAL_TITLE
} from './data/landingSeoContent'
import { getTechDownCommerceViewModel } from '@/lib/products/commerce'
import type { Metadata } from 'next'

const socialImage = {
  url: 'https://utekos.no/og-image-skreddersy-varmen.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'To personer i mørkeblå Utekos TechDown™ sitter ute på en terrasse.'
} as const

export const metadata: Metadata = {
  title: { absolute: LANDING_PAGE_TITLE },
  description: LANDING_PAGE_DESCRIPTION,
  category: 'Yttertøy',
  authors: [{ name: 'Utekos', url: 'https://utekos.no/om-oss' }],
  creator: 'Utekos',
  publisher: 'Utekos',
  alternates: { canonical: LANDING_PAGE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'index': true,
      'follow': true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    title: LANDING_SOCIAL_TITLE,
    description: LANDING_PAGE_DESCRIPTION,
    url: LANDING_PAGE_URL,
    siteName: 'Utekos',
    images: [socialImage]
  },
  twitter: {
    card: 'summary_large_image',
    title: LANDING_SOCIAL_TITLE,
    description: LANDING_PAGE_DESCRIPTION,
    images: [socialImage]
  }
}

type LandingPageProps = {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >
}

async function resolveTechDownCommerce() {
  try {
    return await getTechDownCommerceViewModel()
  } catch (error) {
    console.error(
      'TechDown commerce data is unavailable on /skreddersy-varmen',
      error
    )
    return null
  }
}

function LandingCommerceUnavailable() {
  return (
    <section className='bg-foreground-muted w-full px-6 py-16 text-background'>
      <div className='mx-auto max-w-3xl rounded-sm border border-background/12 bg-foreground p-6 text-center shadow-sm'>
        <h2 className='font-google-sans text-2xl font-bold'>
          Kjøpsvalget er midlertidig utilgjengelig
        </h2>
        <p className='leading-text-paragraph mt-3 text-background/78'>
          Vi kunne ikke bekrefte pris eller lagerstatus fra
          Shopify. Produktinformasjonen er tilgjengelig, men
          Utekos viser ingen konstruerte commerce-opplysninger
          eller kjøpsknapp.
        </p>
      </div>
    </section>
  )
}

export default async function LandingPage({
  searchParams
}: LandingPageProps) {
  const commerce = await resolveTechDownCommerce()
  const defaultVariant = commerce?.variants.find(
    variant => variant.commerce.id === commerce.defaultVariantId
  )

  return (
    <div className='dark:bg-dark-background flex min-h-screen w-full flex-col items-center justify-start overflow-x-clip bg-background'>
      <MetaWebsiteHighlights />

      <StickyMobileAction
        {...(defaultVariant ?
          {
            price: defaultVariant.commerce.price,
            availableForSale:
              defaultVariant.commerce.availableForSale
          }
        : {})}
      />

      <SkreddersyVarmenBreadcrumbs />
      <SkreddersyVarmenKlarnaStrip />
      <HeroAndEmpathy commerce={commerce} />

      <DeferredLandingSections />

      <div
        id='purchase-section'
        className='w-full scroll-mt-17.5 xl:scroll-mt-21.5'
      >
        <PromotionImpression
          promotionId='skreddersy-varmen-purchase'
          promotionName='Skreddersy varmen'
          creativeName='Purchase'
          creativeSlot='purchase'
          className='w-full'
        >
          {commerce ?
            <Suspense fallback={<LandingPurchaseFallback />}>
              <LandingPurchaseSection
                commerce={commerce}
                searchParams={searchParams}
              />
            </Suspense>
          : <LandingCommerceUnavailable />}
        </PromotionImpression>
      </div>

      <PromotionImpression
        promotionId='skreddersy-varmen-social-proof'
        promotionName='Skreddersy varmen'
        creativeName='Social proof'
        creativeSlot='social_proof'
        className='w-full'
      >
        <SectionSocialProof />
      </PromotionImpression>

      <LandingFaq />
      <LandingKlarnaPromotion />
      <PreFooterNavigation />
    </div>
  )
}
