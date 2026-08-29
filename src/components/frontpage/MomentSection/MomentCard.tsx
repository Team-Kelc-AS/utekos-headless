'use client'

import { motion, type Variants } from 'motion/react'
import type { Moment } from '@/components/frontpage/MomentSection/utils/moments'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { H3 } from '@/components/typography/TypographyH3'
import { P } from '@/components/typography/TypographyP'
import { cn } from '@/lib/utils/className'

const cardMotion = {
  hidden: { opacity: 0, y: 32, scale: 0.985 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.72,
      delay: Math.min(index * 0.08, 0.16),
      ease: [0.22, 1, 0.36, 1]
    }
  }),
  hover: {
    y: -4,
    scale: 1.008,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
      mass: 0.85
    }
  }
} satisfies Variants

const articleClassName = 'group h-full min-w-0'

const iconClassName =
  'flex size-12 shrink-0 items-center justify-center rounded-xl border border-light-teal/20 bg-dark-teal text-foreground shadow-[inset_0_1px_1px_color-mix(in_oklch,var(--foreground)_14%,transparent)] ring-1 ring-inset ring-foreground/8'

const cardClassName =
  'h-full rounded-[1.25rem] border border-light-teal/14 p-6 text-foreground shadow-[0_30px_80px_-58px_color-mix(in_oklch,var(--jungle)_96%,black)] ring-1 ring-inset ring-foreground/6 sm:p-7 lg:p-8'

const momentThemeClasses: Record<Moment['theme'], string> = {
  jungle:
    'bg-[color-mix(in_oklch,var(--jungle)_92%,var(--dark-teal)_8%)]',
  pine: 'bg-[color-mix(in_oklch,var(--jungle)_82%,var(--dark-teal)_18%)]',
  teal: 'bg-[color-mix(in_oklch,var(--jungle)_72%,var(--dark-teal)_28%)]'
}

export function MomentCard({
  moment,
  index
}: {
  moment: Moment
  index: number
}) {
  const Icon = moment.icon
  const titleId = `moment-${moment.id}-title`

  return (
    <motion.article
      aria-labelledby={titleId}
      variants={cardMotion}
      custom={index}
      initial='hidden'
      whileInView='visible'
      viewport={{
        once: true,
        amount: 0.32,
        margin: '0px 0px -48px 0px'
      }}
      whileHover='hover'
      className={articleClassName}
    >
      <div className='h-full rounded-[1.65rem] bg-foreground/4 p-1.5 ring-1 ring-foreground/8'>
        <Card
          className={cn(
            cardClassName,
            momentThemeClasses[moment.theme]
          )}
        >
          <div className='flex items-center justify-between gap-4'>
            <p className='font-utekos-text-medium text-[0.68rem] tracking-[0.16em] text-light-teal uppercase'>
              {String(index + 1).padStart(2, '0')} /{' '}
              {moment.eyebrow}
            </p>
            <span className='hidden h-px flex-1 bg-linear-to-r from-light-teal/35 to-transparent md:block' />
          </div>

          <CardHeader className='flex flex-row items-center gap-4 px-0 pb-0'>
            <span className={iconClassName} aria-hidden='true'>
              <Icon
                aria-hidden='true'
                className='size-5 stroke-[1.5]'
              />
            </span>

            <CardTitle className='min-w-0 text-foreground'>
              <H3
                ID={titleId}
                className='pb-0 font-utekos-text-medium text-2xl leading-tight tracking-normal text-balance text-foreground'
              >
                {moment.title}
              </H3>
            </CardTitle>
          </CardHeader>

          <CardContent className='flex flex-1 px-0 pb-0 text-foreground'>
            <CardDescription className='font-utekos-text text-base leading-relaxed tracking-normal text-foreground/82'>
              <P className='text-base leading-relaxed tracking-normal text-foreground/82 not-first:mt-0'>
                {moment.description}
              </P>
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </motion.article>
  )
}
