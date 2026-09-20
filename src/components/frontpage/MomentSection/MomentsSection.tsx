'use client'

import { TypographyMomentsH3 } from './TypographyMomentsH3'
import { MomentCardsGrid } from '@/components/frontpage/MomentSection/MomentCardsGrid'
import { cn } from '@/lib/utils/className'
import { PageSection } from '@/components/layout/PageSection'
import { frontpageSectionStackClassName } from '@/components/frontpage/layout/frontpageSectionStack'
import { Lead } from '@/components/typography/Lead'
import {
  motion,
  MotionConfig,
  type Variants
} from 'motion/react'

const introMotion = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.06, staggerChildren: 0.12 }
  }
} satisfies Variants

const introItemMotion = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] }
  }
} satisfies Variants

export function MomentsSection() {
  return (
    <PageSection
      as='section'
      background='none'
      className={cn(
        frontpageSectionStackClassName,
        'mx-auto bg-night text-foreground'
      )}
      contentClassName='py-12 sm:py-16 md:py-20 lg:py-28'
    >

      <MotionConfig reducedMotion='user'>
        <motion.article
          aria-labelledby='moments-section-heading'
          className={cn('relative w-full overflow-hidden')}
          initial='hidden'
          whileInView='visible'
          viewport={{ once: true, amount: 0.12 }}
          variants={introMotion}
        >
          <motion.div variants={introItemMotion}>
            <TypographyMomentsH3 />
          </motion.div>

          <motion.div variants={introItemMotion}>
            <Lead
              Text='Uansett hvor du finner roen, er Utekos designet for å gjøre opplevelsen bedre.'
              className='mt-6 max-w-2xl pb-0 text-lg! leading-relaxed text-foreground/76 sm:mt-8 md:text-xl!'
            />
          </motion.div>

          <MomentCardsGrid />
        </motion.article>
      </MotionConfig>
    </PageSection>
  )
}
