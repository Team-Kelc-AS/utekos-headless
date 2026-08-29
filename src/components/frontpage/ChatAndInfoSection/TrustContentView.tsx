'use client'

import type { ComponentType } from 'react'
import { motion, type Variants } from 'motion/react'
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'
import { cn } from '@/lib/utils/className'

type InfoCardsComponentProps = Record<string, never>

interface TrustContentViewProps {
  InfoCardsComponent: ComponentType<InfoCardsComponentProps>
}

const contentMotion = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
} satisfies Variants

const revealMotion = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] }
  }
} satisfies Variants

export function TrustContentView({
  InfoCardsComponent
}: TrustContentViewProps) {
  return (
    <motion.div
      variants={contentMotion}
      className={cn(
        'relative z-20 flex min-w-0 flex-col justify-start overflow-visible rounded-md bg-dark-teal px-6 pt-10 pb-8 text-foreground sm:px-10 sm:pt-12 sm:pb-10 md:px-12 md:pt-14 md:pb-12'
      )}
    >
      <div
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_52%_at_12%_0%,color-mix(in_oklch,var(--light-teal)_12%,transparent),transparent_72%)]'
        aria-hidden
      />

      <div className='max-w-2xl'>
        <motion.div variants={revealMotion}>
          <H2
            ID='trust-section-heading'
            className='pb-0 text-3xl! leading-tight text-foreground sm:text-4xl!'
          >
            En opplevelse bygget på tillit
          </H2>
        </motion.div>

        <motion.div variants={revealMotion}>
          <P className='mt-5 text-base leading-relaxed text-foreground/82 not-first:mt-5 sm:mt-6 sm:text-lg sm:not-first:mt-6'>
            Fra du besøker siden vår til du nyter kveldssolen i
            ditt Utekos-plagg – vi er dedikerte til å levere en
            trygg og førsteklasses opplevelse i alle ledd.
          </P>
        </motion.div>
      </div>

      <motion.div
        variants={revealMotion}
        className='mt-12 flex w-full min-w-0 justify-center overflow-visible sm:mt-14 lg:mt-12'
      >
        <InfoCardsComponent />
      </motion.div>
    </motion.div>
  )
}
