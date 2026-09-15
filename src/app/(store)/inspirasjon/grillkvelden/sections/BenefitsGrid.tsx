import { AnimatedBlock } from '@/components/AnimatedBlock'
import {
  HeartHandshake,
  Thermometer,
  Sparkles,
  Calendar
} from 'lucide-react'
import type { Benefit } from '../types'
import { grillSectionSurfaces } from '../theme/sectionSurfaces'
import { SectionBox } from '@/components/layout/SectionBox'
import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'
import { H3 } from '@/components/typography/TypographyH3'
import { P } from '@/components/typography/TypographyP'

const { dark } = grillSectionSurfaces

export const benefitsData: Benefit[] = [
  {
    icon: HeartHandshake,
    title: 'Fornøyde gjester',
    description:
      'Vis at du bryr deg om komforten til gjestene dine.',
    iconBackground: 'bg-card '
  },
  {
    icon: Thermometer,
    title: 'Mindre stress',
    description:
      'Slipp å tenke på pledd, varmeovner og kalde gjester.',
    iconBackground: 'bg-card '
  },
  {
    icon: Sparkles,
    title: 'Perfekt stemning',
    description:
      'Skap en avslappet og lun atmosfære som varer lenger.',
    iconBackground: 'bg-card '
  },
  {
    icon: Calendar,
    title: 'Forlenger sesongen',
    description:
      'Arranger vellykkede grillfester fra tidlig vår til sen høst.',
    iconBackground: 'bg-card '
  }
]

export function BenefitsGrid({
  benefits
}: {
  benefits: Benefit[]
}) {
  return (
    <SectionBox bgcolor='bg-maritime-darkest border-b border-border '>
      <article className={dark.section}>
        <div className='container'>
          <div className='mb-6 w-full'>
            <H2
              ID='fordeler'
              Text='Fordelene for vertskapet'
              className={dark.heading}
            />
            <Lead
              Text='Mindre stress for deg, mer komfort for gjestene —
              en vinn-vinn for kvelden.'
              className={`mt-4 ${dark.lead}`}
            />
          </div>

          <div className='grid grid-cols-1 gap-8 rounded-3xl bg-card py-8 text-card-foreground md:grid-cols-2 md:py-12 lg:grid-cols-4'>
            {benefits.map((benefit, benefitIndex) => (
              <AnimatedBlock
                key={benefit.title}
                className='will-animate-fade-in-scale text-center'
                delay={`${benefitIndex * 0.05}s`}
                threshold={0.2}
              >
                <div
                  className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-border ${benefit.iconBackground}`}
                >
                  <benefit.icon
                    className='size-8 text-card-foreground'
                    aria-hidden
                  />
                </div>
                <H3
                  Text={benefit.title}
                  className='font-google-sans mb-2 font-utekos-text-medium text-lg leading-[1.15] font-bold tracking-[-0.01em] text-foreground'
                ></H3>
                <P
                  Text={benefit.description}
                  className='mx-auto px-8 text-center font-utekos-text text-base tracking-[-0.02em] text-balance text-foreground md:text-lg'
                ></P>
              </AnimatedBlock>
            ))}
          </div>
        </div>
      </article>
    </SectionBox>
  )
}
