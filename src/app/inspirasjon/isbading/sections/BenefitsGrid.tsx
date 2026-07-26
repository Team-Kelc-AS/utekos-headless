// Path: src/app/inspirasjon/isbading/sections/BenefitsGrid.tsx

import { AnimatedBlock } from '@/components/AnimatedBlock'
import { Shield, Shirt, Thermometer, Wind } from 'lucide-react'
import type { Benefit } from '../types'

export const benefitsData: Benefit[] = [
  {
    icon: Thermometer,
    title: 'Gjenopprett varmen',
    description:
      'Absorberende fôr tørker huden og får opp kroppstemperaturen umiddelbart.',
    color: 'text-very-peri'
  },
  {
    icon: Shirt,
    title: 'Ditt mobile skifterom',
    description:
      'Romslig nok til at du enkelt trekker armene inn og skifter diskret på stranden.',
    color: 'text-ancient-water'
  },
  {
    icon: Wind,
    title: '100% vindtett',
    description:
      'Blokkerer den iskalde trekken som ellers stjeler varmen din etter badet.',
    color: 'text-ancient-water'
  },
  {
    icon: Shield,
    title: 'Robust beskyttelse',
    description:
      'Tåler røft vær, snø og sludd mens du nyter endorfinrusen.',
    color: 'text-slate-400'
  }
]

export function BenefitsGrid({
  benefits
}: {
  benefits: Benefit[]
}) {
  return (
    <article className='dark:bg-dark-background bg-background py-24 text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto mb-16 max-w-2xl text-center'>
          <h2 className='text-fluid-display font-google-sans font-bold tracking-normal'>
            Spesiallaget for det ekstreme
          </h2>
          <p className='mt-4 text-lg text-ancient-water'>
            Isbading krever utstyr du kan stole på. Vi har
            fjernet barrierene slik at du kan fokusere på
            opplevelsen.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {benefits.map((benefit, benefitIndex) => (
            <AnimatedBlock
              key={benefit.title}
              className='will-animate-fade-in-scale text-center'
              delay={`${benefitIndex * 0.05}s`}
              threshold={0.2}
            >
              <div className='dark:bg-dark-background/58 mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-foreground/12 bg-background/58'>
                <benefit.icon
                  className={`size-8 ${benefit.color}`}
                />
              </div>
              <h3 className='mb-2 font-utekos-text-medium text-lg'>
                {benefit.title}
              </h3>
              <p className='text-sm text-ancient-water'>
                {benefit.description}
              </p>
            </AnimatedBlock>
          ))}
        </div>
      </div>
    </article>
  )
}
