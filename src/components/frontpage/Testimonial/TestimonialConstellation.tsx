// Path: src/components/frontpage/TestimonialConstellation.tsx
'use client'

import { Star, StarHalf } from 'lucide-react'
import { motion, type Variants } from 'motion/react'
import { TestimonialSection } from './TestimonialSection'
import { PageSection } from '@/components/layout/PageSection'
import { cn } from '@/lib/utils/className'
import { H2 } from '@/components/typography/TypographyH2'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

const headerItemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export function TestimonialConstellation() {
  return (
    <PageSection
      as='section'
      background='muted'
      className={cn(
        'relative isolate overflow-hidden text-foreground'
      )}
      contentClassName='relative z-10'
    >
      <article
        id='testimonial-constellation'
        className='relative mx-auto w-full overflow-hidden text-foreground'
      >
        <div className='relative z-10 text-left'>
          <motion.div
            className='mx-auto mb-20 text-left'
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.35 }}
            transition={{ staggerChildren: 0.15 }}
          >
            <motion.div
              variants={headerItemVariants}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1]
              }}
              className='dark:shadow-dark-background/20 mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-card-foreground shadow-lg shadow-background/20'
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--color-blue-green)'
              }}
            >
              <div
                className='flex gap-0.5 drop-shadow-sm'
                style={{ color: 'var(--review-star)' }}
              >
                {[...Array(5)].map((_, i) =>
                  i < 4 ?
                    <Star
                      size={16}
                      color='currentColor'
                      fill='currentColor'
                      key={i}
                    />
                  : <StarHalf
                      size={16}
                      color='currentColor'
                      fill='currentColor'
                      key={i}
                    />
                )}
              </div>
              <InlineText
                as='small'
                className='text-card-foreground'
              >
                4.8
              </InlineText>
              <InlineText
                as='small'
                className='text-card-foreground'
              >
                / 5
              </InlineText>
            </motion.div>

            <motion.div
              variants={headerItemVariants}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <H2
                ID='testimonial-heading'
                className='mb-6 pb-0 text-left font-sans text-3xl leading-[1.05] font-extrabold text-foreground md:text-5xl lg:text-6xl'
              >
                Hva sier andre{' '}
                <InlineText className='font-sans text-foreground'>
                  livsnytere?
                </InlineText>
              </H2>
            </motion.div>

            <motion.div
              variants={headerItemVariants}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <P className='max-w-3xl text-left text-2xl! leading-snug text-foreground not-first:mt-0'>
                Ekte tilbakemeldinger fra ekte mennesker,
                verdsetter kompromissløs kvalitet og varige
                opplevelser utendørs
              </P>
            </motion.div>
          </motion.div>

          <div className='relative z-20'>
            <TestimonialSection />
          </div>
        </div>
      </article>
    </PageSection>
  )
}
