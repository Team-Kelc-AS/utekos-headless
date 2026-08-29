'use client'

import {
  motion,
  MotionConfig,
  type Variants
} from 'motion/react'
import { TrustContentView } from './TrustContentView'
import { InfoCardStackView } from './InfoCardStackView'
import { AnimatedChat } from '@/components/frontpage/ChatAndInfoSection/AnimatedChat'
import { PageSection } from '@/components/layout/PageSection'

const sectionMotion = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.08, staggerChildren: 0.14 }
  }
} satisfies Variants

const panelMotion = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.64, ease: [0.22, 1, 0.36, 1] }
  }
} satisfies Variants

export function ChatAndInfoSection() {
  return (
    <PageSection as='section' background='muted'>
      <MotionConfig reducedMotion='user'>
        <motion.div
          className='mx-auto rounded-xl'
          initial='hidden'
          whileInView='visible'
          viewport={{
            once: true,
            amount: 0.25,
            margin: '0px 0px -96px 0px'
          }}
          variants={sectionMotion}
        >
          <div className='dark:border-dark-foreground/12 overflow-hidden rounded-xl border border-foreground/12 bg-card'>
            <div className='grid min-w-0 lg:grid-cols-2'>
              <TrustContentView
                InfoCardsComponent={InfoCardStackView}
              />

              <motion.div
                variants={panelMotion}
                className='@container/chat relative min-h-100 min-w-0 overflow-hidden border-t border-light-teal/16 bg-jungle pb-8 text-foreground lg:border-t-0 lg:border-l'
              >
                <AnimatedChat />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </MotionConfig>
    </PageSection>
  )
}
