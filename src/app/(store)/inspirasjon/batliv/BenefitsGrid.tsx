'use client'

import { Sparkles, Thermometer, Users, Wind } from 'lucide-react'
const benefitsData = [
  {
    icon: Thermometer,
    title: 'Øyeblikkelig varme',
    description:
      'Effektiv beskyttelse når temperaturen plutselig synker.',
    color: 'text-very-peri'
  },
  {
    icon: Wind,
    title: 'Vindtett komfort',
    description:
      'Designet for å stenge den kjølige sjøbrisen og trekken ute.',
    color: 'text-ancient-water'
  },
  {
    icon: Sparkles,
    title: 'Kompakt og praktisk',
    description:
      'Tar minimalt med plass og er enkel å stue vekk om bord.',
    color: 'text-primary'
  },
  {
    icon: Users,
    title: 'Sosial magnet',
    description:
      'Gjør din båt til det naturlige samlingspunktet i havna.',
    color: 'text-rose-500'
  }
]

export function BenefitsGrid() {
  return (
    <article className='bg-background py-24 text-foreground'>
      <div className='container mx-auto px-4'>
        <div className='boat-benefits-header mb-6 text-center'>
          <h2 className='mx-auto max-w-3xl text-foreground md:max-w-4xl'>
            Skapt for livet på sjøen
          </h2>
          <p className='utekos-section-lead mx-auto mt-4 max-w-2xl text-muted-foreground'>
            Vi vet at været kan snu fort. Derfor er Utekos
            designet for å gi deg øyeblikkelig og pålitelig
            varme.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {benefitsData.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className='boat-benefits-card text-center'
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground'>
                  <Icon className={`h-8 w-8 ${benefit.color}`} />
                </div>
                <h3 className='mb-2 font-utekos-text-medium text-lg'>
                  {benefit.title}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}
