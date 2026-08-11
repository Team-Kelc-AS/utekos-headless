// Path: src/app/skreddersy-varmen/components/HeroEmpathy.tsx
import { Hero } from './Hero'
import { EmpathySection } from './EmpathySection'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

export function HeroAndEmpathy({
  commerce
}: {
  commerce: ProductCommerceViewModel | null
}) {
  return (
    <>
      <PromotionImpression
        promotionId='skreddersy-varmen-hero'
        promotionName='Skreddersy varmen'
        creativeName='Hero'
        creativeSlot='hero'
        className='w-full'
      >
        <Hero commerce={commerce} />
      </PromotionImpression>
      <PromotionImpression
        promotionId='skreddersy-varmen-empathy'
        promotionName='Skreddersy varmen'
        creativeName='Empathy'
        creativeSlot='empathy'
        className='w-full'
      >
        <EmpathySection />
      </PromotionImpression>
    </>
  )
}
