import type { Metadata } from 'next'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'
import { ComfyrobeFaqSection } from './components/ComfyrobeFaqSection'
import { ComfyrobeHero } from './components/ComfyrobeHero'
import { ComfyrobeMotionProvider } from './components/ComfyrobeMotionProvider'
import { ComfyrobeProductDetailsSection } from './components/ComfyrobeProductDetailsSection'
import { ComfyrobePurchaseSection } from './components/ComfyrobePurchaseSection'
import { ComfyrobeStickyPurchase } from './components/ComfyrobeStickyPurchase'
import { PreFooterNavigation } from '../skreddersy-varmen/components/PreFooterNavigation'
import {
  COMFYROBE_LANDING_DESCRIPTION,
  COMFYROBE_LANDING_IMAGE,
  COMFYROBE_LANDING_NAME,
  COMFYROBE_LANDING_URL,
  COMFYROBE_PRODUCT_URL
} from './data/comfyrobeLandingSeo'
import { buildComfyrobeOfferSummary } from './lib/buildComfyrobeOfferSummary'
import { getComfyrobeLandingProduct } from './lib/getComfyrobeLandingProduct'

export const metadata: Metadata = {
  title: COMFYROBE_LANDING_NAME,
  description: COMFYROBE_LANDING_DESCRIPTION,
  alternates: { canonical: COMFYROBE_PRODUCT_URL },
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    locale: 'nb_NO',
    siteName: 'Utekos',
    title: 'Comfyrobe™ – tøff mot været, komfortabel mot deg',
    description:
      'Vanntett allværskåpe med mykt SherpaCore™-fôr for norsk hverdagsvær.',
    url: COMFYROBE_LANDING_URL,
    images: [
      {
        url: COMFYROBE_LANDING_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Kvinne med Comfyrobe fra Utekos'
      }
    ]
  }
}

export default async function ComfyrobeLandingPage() {
  const product = await getComfyrobeLandingProduct()
  const offer = buildComfyrobeOfferSummary(product)

  return (
    <article className='flex min-h-screen w-full flex-col overflow-x-clip bg-background text-foreground'>
      <div className='w-full bg-cloud-dancer text-background'>
        <UtekosBreadcrumbBar
          surface='transparent'
          items={[
            { label: 'Hjem', href: '/' },
            { label: 'Comfyrobe™ XL' }
          ]}
          containerClassName='px-6 py-3 md:px-8 lg:px-12'
          listClassName='flex-nowrap whitespace-nowrap text-sm'
        />
      </div>

      <ComfyrobeHero offer={offer} product={product} />

      <PromotionImpression
        promotionId='comfyrobe-purchase'
        promotionName='Comfyrobe'
        creativeName='Purchase'
        creativeSlot='purchase'
        className='w-full'
      >
        <div
          id='purchase-section'
          className='w-full scroll-mt-20'
        >
          <ComfyrobePurchaseSection product={product} />
        </div>
      </PromotionImpression>

      <ComfyrobeMotionProvider>
        <div className='w-full md:grid md:grid-cols-2 md:items-stretch'>
          <ComfyrobeProductDetailsSection />
          <ComfyrobeFaqSection />
        </div>

        <ComfyrobeStickyPurchase offer={offer} />
      </ComfyrobeMotionProvider>

      <PreFooterNavigation variant='comfyrobe' />
    </article>
  )
}
