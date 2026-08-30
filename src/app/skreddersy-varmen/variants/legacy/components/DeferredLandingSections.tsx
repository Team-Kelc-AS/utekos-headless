// Path: src/app/skreddersy-varmen/components/DeferredLandingSections.tsx

import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import { SectionThreeInOne } from './SectionThreeInOne'
import { TechDownSlider } from './TechDownSlider'

export function DeferredLandingSections() {
  return (
    <>
      <PromotionImpression
        promotionId='skreddersy-varmen-three-in-one'
        promotionName='Skreddersy varmen'
        creativeName='Three in one'
        creativeSlot='three_in_one'
        className='w-full'
      >
        <SectionThreeInOne />
      </PromotionImpression>
      <PromotionImpression
        promotionId='skreddersy-varmen-techdown'
        promotionName='Skreddersy varmen'
        creativeName='TechDown slider'
        creativeSlot='techdown_slider'
        className='w-full'
      >
        <TechDownSlider />
      </PromotionImpression>
    </>
  )
}
