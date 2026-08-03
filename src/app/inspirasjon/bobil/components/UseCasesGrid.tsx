import { MoonIcon } from '@heroicons/react/24/outline'
import { Sunrise, Wind } from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { Card, CardContent } from '@/components/ui/card'
import { SectionBox } from '@/components/layout/SectionBox'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { Lead } from '@/components/typography/Lead'
import { P } from '@/components/typography/TypographyP'
import type { UseCase } from '../types'

export const useCasesData: UseCase[] = [
  {
    icon: Sunrise,
    time: 'Morgen',
    title: 'Den kjølige morgenkaffen',
    description:
      'Start dagen med kaffe utenfor bobilen, innhyllet i varme mens naturen våkner.',
    temperature: '5-12°C',
    color: 'bg-card ',
    iconColor: 'text-foreground ',
    bgColor: 'bg-jungle'
  },
  {
    icon: MoonIcon,
    time: 'Kveld',
    title: 'Sosiale kvelder under stjernene',
    description:
      'Forleng kvelden med venner og familie uten å la kulden drive dere inn.',
    temperature: '8-15°C',
    color: 'bg-card ',
    iconColor: 'text-foreground ',
    bgColor: 'bg-jungle'
  },
  {
    icon: Wind,
    time: 'Overgang',
    title: 'Vår og høst-camping',
    description:
      'Utvid sesongen og opplev Norge når det er på sitt vakreste.',
    temperature: '3-10°C',
    color: 'bg-card ',
    iconColor: 'text-foreground ',
    bgColor: 'bg-jungle'
  }
]

export function UseCasesGrid({
  useCases
}: {
  useCases: UseCase[]
}) {
  return (
    <SectionBox bgcolor='bg-jungle text-foreground'>
      <article
        id='bruksomrader'
        className='text-foreground'
      >
        <div className='container'>
          <div className='w-full'>
            <H2
              Text='Utekos gjennom bobildøgnet'
              ID='bruksomrader-h2'
              className='text-foreground'
            />
            <Lead
              Text='Fra soloppgang til solnedgang'
              className='text-foreground'
            />
          </div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            {useCases.map((useCase, useCaseIndex) => {
              const Icon = useCase.icon
              const iconBackgroundClass =
                useCase.bgColor ?? 'bg-sidebar '

              return (
                <AnimatedBlock
                  key={useCase.title}
                  className='will-animate-fade-in-up'
                  delay={`${useCaseIndex * 0.1}s`}
                  threshold={0.2}
                >
                  <Card
                    className={`group @container relative h-full overflow-hidden border-border ${useCase.color}`}
                  >
                    <CardContent className='relative p-8'>
                      <div className='mb-6 flex items-center gap-4'>
                        <div
                          className={`${iconBackgroundClass} flex size-12 items-center justify-center rounded-lg border border-border`}
                        >
                          <Icon
                            className={`size-6 ${useCase.iconColor}`}
                          />
                        </div>

                        <div>
                          <p className='text-sm tracking-[-0.02em] text-foreground'>
                            {useCase.time}
                          </p>
                          <p className='text-sm font-medium tracking-[-0.02em]'>
                            {useCase.temperature}
                          </p>
                        </div>
                      </div>

                      <H3
                        Text={useCase.title}
                        className='font-google-sans leading-[0.95] font-bold text-foreground'
                      />
                      <P
                        Text={useCase.description}
                        className='tracking-[-0.02em]'
                      />
                    </CardContent>
                  </Card>
                </AnimatedBlock>
              )
            })}
          </div>
        </div>
      </article>
    </SectionBox>
  )
}
