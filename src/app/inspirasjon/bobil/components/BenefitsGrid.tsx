import {
  CalendarIcon,
  SparklesIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { ThermometerIcon } from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { SectionBox } from '@/components/layout/SectionBox'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { Lead } from '@/components/typography/Lead'
import type { Benefit } from '../types'

export const benefitsData: Benefit[] = [
  {
    icon: ThermometerIcon,
    title: 'Øyeblikkelig varme',
    description: 'Fra kald morgen til koselig stund på sekunder',
    color: 'text-primary',
    bgColor: 'bg-background/24'
  },
  {
    icon: SparklesIcon,
    title: 'Kompakt og praktisk',
    description:
      'Tar minimal plass i bobilen, maksimal komfort på turen',
    color: 'text-dark-teal',
    bgColor: 'bg-background/24'
  },
  {
    icon: CalendarIcon,
    title: 'Forleng sesongen',
    description:
      'Bruk bobilen fra tidlig vår til sen høst i komfort',
    color: 'text-primary',
    bgColor: 'bg-background/24'
  },
  {
    icon: UsersIcon,
    title: 'Sosial magnet',
    description: 'Bli samlingspunktet på campingplassen',
    color: 'text-primary',
    bgColor: 'bg-background/24'
  }
]

export function BenefitsGrid({
  benefits
}: {
  benefits: Benefit[]
}) {
  return (
    <SectionBox bgcolor='bg-background border-b border-border'>
      <article className='text-foreground'>
        <div className='container'>
          <div className='mb-6 md:mb-8 lg:mb-10'>
            <H2
              Text='Skapt for bobilisten'
              ID='skapt-for-bobilisten'
              className='text-foreground'
            />
            <Lead
              Text='Komfort som følger bobilen. Fra tidlig vår til sen høst.'
              className='text-foreground'
            />
          </div>

          <div className='grid grid-cols-1 gap-8 rounded-3xl bg-jungle py-6 md:grid-cols-2 md:py-12 lg:grid-cols-4'>
            {benefits.map((benefit, benefitIndex) => {
              const Icon = benefit.icon
              const iconBackgroundClass =
                benefit.bgColor ??
                'bg-background/24'

              return (
                <AnimatedBlock
                  key={benefit.title}
                  className='will-animate-fade-in-scale text-center'
                  delay={`${benefitIndex * 0.05}s`}
                  threshold={0.2}
                >
                  <div
                    className={`${iconBackgroundClass} mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-foreground/12`}
                  >
                    <Icon
                      className={`size-8 ${benefit.color}`}
                      aria-hidden='true'
                    />
                  </div>

                  <H3
                    Text={benefit.title}
                    className='mb-2 pb-0 text-foreground'
                  />

                  <p className='tracking-[-0.02em]'>
                    {benefit.description}
                  </p>
                </AnimatedBlock>
              )
            })}
          </div>
        </div>
      </article>
    </SectionBox>
  )
}
