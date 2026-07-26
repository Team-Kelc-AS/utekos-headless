import { AnimatedBlock } from '@/components/AnimatedBlock'
import {
  Settings2,
  HeartHandshake,
  MapPinIcon,
  Thermometer
} from 'lucide-react'
import type { Benefit } from '../types'

// Dataene oppdatert med Utekos Premium fargepalett
export const benefitsData: Benefit[] = [
  {
    icon: Thermometer,
    title: 'Øyeblikkelig varme',
    description:
      'Fra kjølig ankomst til peiskos-følelse på sekunder.',
    benefitColor:
      'bg-featured-foreground dark:bg-dark-featured-foreground',
    iconColor: 'text-featured dark:text-dark-featured'
  },
  {
    icon: Settings2,
    title: 'Praktisk design',
    description:
      'Tar minimalt med plass og er enkel å ta med seg.',
    benefitColor:
      'bg-featured-foreground dark:bg-dark-featured-foreground',
    iconColor: 'text-featured dark:text-dark-featured'
  },
  {
    icon: HeartHandshake,
    title: 'Forlenger hyggen',
    description:
      'Mer tid til de gode samtalene utendørs, uansett vær.',
    benefitColor:
      'bg-featured-foreground dark:bg-dark-featured-foreground',
    iconColor: 'text-featured dark:text-dark-featured'
  },
  {
    icon: MapPinIcon,
    title: 'En del av hytten',
    description:
      'Blir like selvsagt å ta på seg som tøflene inne.',
    benefitColor:
      'bg-featured-foreground dark:bg-dark-featured-foreground',
    iconColor: 'text-featured dark:text-dark-featured'
  }
]

export function BenefitsGrid({
  benefits
}: {
  benefits: Benefit[]
}) {
  return (
    <article className='border-featured-border dark:border-dark-featured-border bg-featured dark:bg-dark-featured w-full min-w-0 overflow-x-clip border-t py-24 text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='mb-20 max-w-3xl text-left lg:max-w-4xl'>
          <h2 className='text-fluid-display font-google-sans font-bold tracking-normal text-foreground'>
            Designet for hyttelivet
          </h2>
          <p className='mt-5 text-lg leading-relaxed text-foreground'>
            Komfort, kvalitet og smarte detaljer gjør det lett å
            bruke hytten mer.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-8 lg:grid-cols-4'>
          {benefits.map((benefit, benefitIndex) => (
            <AnimatedBlock
              key={benefit.title}
              className='group will-animate-fade-in-scale text-center'
              delay={`${benefitIndex * 0.05}s`}
              threshold={0.2}
            >
              <div
                className={`mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110 ${benefit.benefitColor}`}
              >
                <benefit.icon
                  className={`size-7 ${benefit.iconColor}`}
                  aria-hidden
                />
              </div>
              <h3 className='font-google-sans mb-3 font-sans text-xl font-bold tracking-[-0.01em]'>
                {benefit.title}
              </h3>
              <p className='mx-auto max-w-65 text-base leading-relaxed text-foreground'>
                {benefit.description}
              </p>
            </AnimatedBlock>
          ))}
        </div>
      </div>
    </article>
  )
}
