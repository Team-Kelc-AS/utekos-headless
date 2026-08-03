// Path: src/app/inspirasjon/terrassen/sections/BenefitsGrid.tsx

import { Home, Sparkles, Thermometer, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { Lead } from '@/components/typography/Lead'
import { P } from '@/components/typography/TypographyP'
import { MotionCard, MotionReveal } from './TerraceMotion'

type Benefit = {
  icon: LucideIcon
  title: string
  description: string
}

export const benefitsData: Benefit[] = [
  {
    icon: Thermometer,
    title: 'Øyeblikkelig komfort',
    description: 'Fra kjølig trekk til lun hygge på et øyeblikk.'
  },
  {
    icon: Home,
    title: 'Utvider hjemmet ditt',
    description:
      'Gjør uteplassen til en funksjonell del av huset, oftere.'
  },
  {
    icon: Sparkles,
    title: 'Enkel i bruk',
    description:
      'Lett å ta frem, lett å rydde vekk. Alltid klar for en kosestund.'
  },
  {
    icon: Users,
    title: 'Inviterer til samvær',
    description:
      'Skap en innbydende atmosfære som gjestene dine vil elske.'
  }
]

export function BenefitsGrid({
  benefits
}: {
  benefits: Benefit[]
}) {
  return (
    <article className='bg-jungle py-24 text-[var(--terrace-cream)] md:py-32'>
      <div className='container mx-auto px-4'>
        <MotionReveal className='mb-16 max-w-3xl md:max-w-4xl'>
          <H2
            ID='terrasse-investering'
            Text='En investering i hjemmet'
            className='pb-0 text-left text-[clamp(3rem,6vw,5.75rem)] leading-[0.95] text-[var(--terrace-cream)]'
          />
          <Lead className='mt-6 max-w-3xl pb-0 text-left text-[var(--terrace-sage-soft)] md:pb-0 lg:pb-0'>
            Få mer ut av uteplassen du allerede har. Utekos er
            designet for å maksimere komforten i hverdagen.
          </Lead>
        </MotionReveal>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon

            return (
              <MotionCard
                key={benefit.title}
                delay={index * 0.06}
                y={18}
              >
                <div className='h-full rounded-lg border border-[var(--terrace-line-dark)] bg-background p-7 text-left text-[var(--terrace-cream)] shadow-[0_28px_74px_-58px_rgb(0_0_0/0.88)] backdrop-blur-xl sm:p-8'>
                  <div className='mb-7 flex items-start gap-5'>
                    <div className='flex size-14 shrink-0 items-center justify-center rounded-lg border border-[var(--terrace-line-dark)] bg-jungle text-foreground'>
                      <Icon
                        className='size-7'
                        aria-hidden='true'
                      />
                    </div>
                    <H3
                      Text={benefit.title}
                      className='pt-1 pb-0 text-left text-2xl leading-[1.12] text-[var(--terrace-cream)]'
                    />
                  </div>
                  <P className='mt-0 text-left text-base leading-relaxed text-[var(--terrace-sage-soft)] not-first:mt-0'>
                    {benefit.description}
                  </P>
                </div>
              </MotionCard>
            )
          })}
        </div>
      </div>
    </article>
  )
}
