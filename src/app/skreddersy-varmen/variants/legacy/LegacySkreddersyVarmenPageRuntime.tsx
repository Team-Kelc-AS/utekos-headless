import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { LandingFaq } from '@/app/skreddersy-varmen/components/LandingFaq'
import {
  LandingPurchaseSlot,
  StickyMobileActionSlot
} from '@/app/skreddersy-varmen/components/SkreddersyVarmenCommerceSlots'
import { MetaWebsiteHighlights } from '@/app/skreddersy-varmen/components/MetaWebsiteHighlights'
import { PreFooterNavigation } from '@/app/skreddersy-varmen/components/PreFooterNavigation'
import { SectionSocialProof } from '@/app/skreddersy-varmen/components/SectionSocialProof'
import { SkreddersyVarmenKlarnaStrip } from '@/app/skreddersy-varmen/components/SkreddersyVarmenKlarnaStrip'
import { DeferredKlarnaOnSiteMessaging } from '@/app/skreddersy-varmen/components/DeferredKlarnaOnSiteMessaging'
import { DeferredLandingSections } from './components/DeferredLandingSections'
import { HeroAndEmpathy } from './components/HeroEmpathy'
import { SkreddersyVarmenBreadcrumbs } from './components/SkreddersyVarmenBreadcrumbs'

export function LegacySkreddersyVarmenPageRuntime() {
  return (
    <div className='flex min-h-screen w-full flex-col items-center justify-start overflow-x-clip bg-background'>
      <MetaWebsiteHighlights />

      <StickyMobileActionSlot />

      <SkreddersyVarmenBreadcrumbs />
      <SkreddersyVarmenKlarnaStrip />
      <HeroAndEmpathy />

      <div
        id='purchase-section'
        className='w-full scroll-mt-17.5 xl:scroll-mt-21.5'
      >
        <DeferredKlarnaOnSiteMessaging />
        <PromotionImpression
          promotionId='skreddersy-varmen-purchase'
          promotionName='Skreddersy varmen'
          creativeName='Purchase'
          creativeSlot='purchase'
          className='w-full'
        >
          <LandingPurchaseSlot />
        </PromotionImpression>
      </div>

      <DeferredLandingSections />

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
