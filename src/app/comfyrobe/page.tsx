import type { Metadata } from 'next'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { ComfyrobeFaqSection } from './components/ComfyrobeFaqSection'
import { ComfyrobeFinalCta } from './components/ComfyrobeFinalCta'
import { ComfyrobeGuidedDemo } from './components/ComfyrobeGuidedDemo'
import { ComfyrobeLandingClient } from './components/ComfyrobeLandingClient'
import { ComfyrobeMotionProvider } from './components/ComfyrobeMotionProvider'
import { ComfyrobeProofBridge } from './components/ComfyrobeProofBridge'
import { ComfyrobePurchaseSection } from './components/ComfyrobePurchaseSection'
import { ComfyrobeStickyPurchase } from './components/ComfyrobeStickyPurchase'
import { getComfyrobeLandingProduct } from './lib/getComfyrobeLandingProduct'
import { buildComfyrobeOfferSummary } from './lib/buildComfyrobeOfferSummary'
import {
  COMFYROBE_LANDING_DESCRIPTION,
  COMFYROBE_LANDING_IMAGE,
  COMFYROBE_LANDING_NAME,
  COMFYROBE_LANDING_URL,
  COMFYROBE_PRODUCT_URL
} from './data/comfyrobeLandingSeo'

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
        height: 1200,
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
      <ComfyrobeMotionProvider>
        <ComfyrobeLandingClient offer={offer} />
        <ComfyrobeProofBridge />

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

        <ComfyrobeGuidedDemo />
        <ComfyrobeFaqSection />

        <PromotionImpression
          promotionId='comfyrobe-purchase'
          promotionName='Comfyrobe'
          creativeName='Final CTA'
          creativeSlot='final_cta'
          className='w-full'
        >
          <ComfyrobeFinalCta offer={offer} />
        </PromotionImpression>

        <ComfyrobeStickyPurchase offer={offer} />
      </ComfyrobeMotionProvider>
    </article>
  )
}
