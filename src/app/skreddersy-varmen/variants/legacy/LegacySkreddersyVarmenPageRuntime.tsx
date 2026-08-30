import { Suspense } from 'react'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { LandingCommerceUnavailable } from '@/app/skreddersy-varmen/components/LandingCommerceUnavailable'
import { LandingFaq } from '@/app/skreddersy-varmen/components/LandingFaq'
import { LandingPurchaseFallback } from '@/app/skreddersy-varmen/components/LandingPurchaseFallback'
import { LandingPurchaseSection } from '@/app/skreddersy-varmen/components/LandingPurchaseSection'
import { MetaWebsiteHighlights } from '@/app/skreddersy-varmen/components/MetaWebsiteHighlights'
import { PreFooterNavigation } from '@/app/skreddersy-varmen/components/PreFooterNavigation'
import { SectionSocialProof } from '@/app/skreddersy-varmen/components/SectionSocialProof'
import { SkreddersyVarmenKlarnaStrip } from '@/app/skreddersy-varmen/components/SkreddersyVarmenKlarnaStrip'
import { StickyMobileAction } from '@/app/skreddersy-varmen/components/StickyMobileAction'
import { resolveSkreddersyVarmenCommerce } from '@/app/skreddersy-varmen/data/resolveSkreddersyVarmenCommerce'
import type { LandingSearchParams } from '@/app/skreddersy-varmen/components/SkreddersyVarmenPageRuntime'
import { DeferredLandingSections } from './components/DeferredLandingSections'
import { HeroAndEmpathy } from './components/HeroEmpathy'
import { SkreddersyVarmenBreadcrumbs } from './components/SkreddersyVarmenBreadcrumbs'

export async function LegacySkreddersyVarmenPageRuntime({
  searchParams
}: {
  searchParams: LandingSearchParams
}) {
  const commerce = await resolveSkreddersyVarmenCommerce()
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
      <PreFooterNavigation />
    </div>
  )
}
