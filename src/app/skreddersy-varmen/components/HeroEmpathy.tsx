import type { ReactNode } from 'react'
import { Hero } from './Hero'
import { EmpathyStory } from './EmpathyStory'
import { PromotionImpression } from '@/components/analytics/PromotionImpression'
import {
  SKREDDERSY_VARMEN_PROMOTIONS,
  type SkreddersyVarmenPageContent
} from '../data/skreddersyVarmenPageModel'
import type { ProductModel } from '@/lib/products/commerce'
import styles from './SkreddersyVarmenTheatre.module.css'

export function HeroTheatre({
  commerce,
  content
}: {
  commerce: ProductModel | null
  content: SkreddersyVarmenPageContent['hero']
}) {
  return (
    <PromotionImpression
      promotionId={SKREDDERSY_VARMEN_PROMOTIONS.hero}
      promotionName='Skreddersy varmen'
      creativeName='Hero'
      creativeSlot='hero'
      className={styles.heroPromotion!}
    >
      <div className={styles.heroTrack}>
        <div className={styles.heroSticky}>
          <div
            className={styles.heroClip}
            data-hero-reveal-surface
          >
            <Hero commerce={commerce} content={content} />
          </div>
        </div>
      </div>
    </PromotionImpression>
  )
}

export function HeroRevealEmpathy({
  content,
  children
}: {
  content: SkreddersyVarmenPageContent['empathy']
  children?: ReactNode
}) {
  return (
    <div
      className={styles.empathyPromotion}
      data-empathy-promotion
    >
      <PromotionImpression
        promotionId={SKREDDERSY_VARMEN_PROMOTIONS.empathy}
        promotionName='Skreddersy varmen'
        creativeName='Empathy'
        creativeSlot='empathy'
        minimumVisibleRatio={0.5}
        className={styles.empathyTracking!}
      >
        <span aria-hidden data-empathy-impression-sentinel />
      </PromotionImpression>

      <EmpathyStory content={content}>{children}</EmpathyStory>
    </div>
  )
}
