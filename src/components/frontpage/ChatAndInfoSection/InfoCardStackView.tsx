'use client'

import { Lock, ShoppingBag } from 'lucide-react'
import { motion, type Variants } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import UtekosLogo from '@public/icon.png'
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'
import { H3 } from '@/components/typography/TypographyH3'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'
import { cn } from '@/lib/utils/className'

const TrafficLights = ({
  variant = 'default'
}: {
  variant?: 'default' | 'colored' | 'card'
}) => {
  const colors =
    variant === 'colored' ?
      [
        'bg-destructive dark:bg-dark-destructive',
        'bg-chart-3 dark:bg-dark-chart-3',
        'bg-chart-4 dark:bg-dark-chart-4'
      ]
    : variant === 'card' ?
      [
        'bg-card-foreground/45 dark:bg-dark-card-foreground/45',
        'bg-card-foreground/65 dark:bg-dark-card-foreground/65',
        'bg-card-foreground/85 dark:bg-dark-card-foreground/85'
      ]
    : [
        'bg-secondary-foreground/45 dark:bg-dark-secondary-foreground/45',
        'bg-secondary-foreground/65 dark:bg-dark-secondary-foreground/65',
        'bg-secondary-foreground/85 dark:bg-dark-secondary-foreground/85'
      ]

  return (
    <div className='absolute top-[11%] left-[8%] z-20 flex gap-[0.35em]'>
      {colors.map((color, i) => (
        <div
          key={i}
          className={cn(
            'aspect-square w-[0.45em] rounded-full',
            color
          )}
        />
      ))}
    </div>
  )
}

const stackMotion = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } }
} satisfies Variants

const cardMotion = {
  hidden: { opacity: 0, x: -26, y: 10, rotate: -1.5 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transition: { duration: 0.66, ease: [0.22, 1, 0.36, 1] }
  }
} satisfies Variants

const cardSizeClasses =
  'absolute aspect-[1.2/1] w-[84%] @2xs/stack:aspect-[1.62/1] sm:w-[76%] sm:aspect-[2/1]! lg:w-[74%]'

const cardBaseClasses =
  '@container/card overflow-hidden rounded-xl border p-[clamp(0.875rem,4.5cqi,1.5rem)] text-[clamp(0.82rem,3.45cqi,1rem)] shadow-2xl shadow-black/16 will-change-transform'

const cardContentRowClasses =
  'relative z-10 flex items-start gap-[0.8em] pt-[clamp(2.15rem,9.5cqi,2.9rem)]'

const cardTitleClasses =
  'pb-0 text-[1.15em] leading-[1.12] font-utekos-text-medium'

const cardTextClasses =
  'mt-[0.42em] text-[0.95em] leading-snug font-normal not-first:mt-0'

const backCardPlacementClasses = 'top-0 left-0 z-0'

const frontCardPlacementClasses =
  'top-[39%] left-[16%] z-10 sm:top-[40%] sm:left-[24%] lg:left-[26%]'

const backCardClasses = cn(
  cardSizeClasses,
  cardBaseClasses,
  backCardPlacementClasses,
  'border-card-foreground/14 bg-[color-mix(in_oklch,var(--color-card)_94%,var(--color-foreground)_6%)] text-card-foreground'
)

const frontCardClasses = cn(
  cardSizeClasses,
  cardBaseClasses,
  frontCardPlacementClasses,
  'dark:border-dark-foreground/12 dark:bg-dark-background dark:text-dark-foreground border-foreground/12 bg-background text-foreground'
)

const backCardIconClassName =
  'flex size-[clamp(1.9rem,8cqi,2.35rem)] shrink-0 items-center justify-center rounded-lg border border-card-foreground/35 bg-card-foreground text-card dark:border-dark-card-foreground/35'

const frontCardIconClassName =
  'flex size-[clamp(1.9rem,8cqi,2.35rem)] shrink-0 items-center justify-center rounded-lg border border-foreground/20 bg-foreground/8 text-foreground dark:border-dark-foreground/20 dark:bg-dark-foreground/10 dark:text-dark-foreground'

export function InfoCardStackView() {
  return (
    <motion.div
      variants={stackMotion}
      className='@container/stack @container relative z-20 mx-auto aspect-[1/1.04] w-full max-w-[min(100%,44rem)] overflow-visible text-[clamp(0.875rem,2.8cqi,1rem)] sm:aspect-16/10'
    >
      <div
        className='pointer-events-none absolute inset-[-6%] rounded-3xl bg-[radial-gradient(70%_64%_at_24%_18%,color-mix(in_oklch,var(--color-secondary-foreground)_10%,transparent),transparent_68%)]'
        aria-hidden
      />

      <motion.div
        variants={cardMotion}
        whileHover={{ y: -4, transition: { duration: 0.24 } }}
        className={backCardClasses}
      >
        <div
          className='pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(72%_64%_at_18%_22%,color-mix(in_oklch,var(--color-card-foreground)_10%,transparent),transparent_66%)]'
          aria-hidden
        />

        <BackgroundRippleEffect
          rows={5}
          cols={11}
          cellSize={38}
          interactive={false}
          className='pointer-events-none opacity-40'
        />

        <TrafficLights variant='card' />

        <div className={cardContentRowClasses}>
          <div className={backCardIconClassName}>
            <ShoppingBag className='size-[1.12em] stroke-[1.7]' />
          </div>

          <div className='min-w-0'>
            <H3
              className={cn(
                cardTitleClasses,
                'text-card-foreground'
              )}
            >
              En trygg handel
            </H3>

            <P
              className={cn(
                cardTextClasses,
                'text-card-foreground/88'
              )}
            >
              Sikre betalingsløsninger og 14 dagers angrerett.
            </P>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={cardMotion}
        whileHover={{ y: -4, transition: { duration: 0.24 } }}
        className={frontCardClasses}
      >
        <BackgroundRippleEffect
          rows={5}
          cols={11}
          cellSize={38}
          interactive={false}
          className='pointer-events-none opacity-25'
        />

        <div
          className='absolute inset-0 z-0 bg-[radial-gradient(75%_62%_at_68%_20%,color-mix(in_oklch,var(--color-foreground)_8%,transparent),transparent_62%)]'
          aria-hidden
        />

        <TrafficLights variant='colored' />

        <div className='relative z-10 flex h-full min-h-0 flex-col'>
          <div className={cardContentRowClasses}>
            <div className={frontCardIconClassName}>
              <Lock className='size-[1.12em] stroke-[1.7]' />
            </div>

            <div className='min-w-0'>
              <H3
                className={cn(
                  cardTitleClasses,
                  'text-foreground'
                )}
              >
                Ditt personvern
              </H3>

              <P
                className={cn(
                  cardTextClasses,
                  'text-foreground/88'
                )}
              >
                Vi tar personvern på alvor. Se hvordan vi
                behandler dine data i vår{' '}
                <Link
                  href='/personvern'
                  className='dark:focus-visible:outline-dark-foreground font-normal text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
                >
                  <InlineText>personvernserklæring</InlineText>
                </Link>
                .
              </P>
            </div>
          </div>

          <div className='mt-auto flex justify-center pt-[clamp(1.25rem,5cqi,1.85rem)] pb-[0.55em]'>
            <Image
              src={UtekosLogo}
              alt='Utekos Logo'
              width={32}
              height={32}
              className='size-[clamp(1.55rem,7cqi,2.35rem)]'
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
