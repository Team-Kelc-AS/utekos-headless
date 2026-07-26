import { Card, CardContent } from '@/components/ui/card'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { Flame, Moon, Users } from 'lucide-react'
import type { UseCase } from '../types'
import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'
import { SectionBox } from '@/components/layout/SectionBox'

export const useCasesData: UseCase[] = [
  {
    icon: Flame,
    time: 'Før maten',
    title: 'Mens grillen blir varm',
    description:
      'Hold gjestene komfortable mens de venter på den perfekte gløden.',
    color: 'bg-card ',
    iconColor: 'text-accent dark:text-dark-accent',
    iconBackground: 'bg-card-foreground -foreground'
  },
  {
    icon: Users,
    time: 'Etter maten',
    title: 'Rundt bordet',
    description:
      'La de gode samtalene fortsette når temperaturen faller.',
    color: 'bg-card ',
    iconColor: 'text-accent dark:text-dark-accent',
    iconBackground: 'bg-card-foreground -foreground'
  },
  {
    icon: Moon,
    time: 'Sent på kvelden',
    title: 'Når stjernene titter frem',
    description:
      'For de som blir igjen — komfort som varer til den siste samtalen.',
    color: 'bg-card ',
    iconColor: 'text-accent dark:text-dark-accent',
    iconBackground: 'bg-card-foreground -foreground'
  }
]

export function UseCasesGrid({
  useCases
}: {
  useCases: UseCase[]
}) {
  return (
    <SectionBox bgcolor='bg-secondary dark:bg-dark-secondary text-secondary-foreground dark:text-dark-secondary-foreground border-b border-border '>
      <article
        id='bruksomrader'
        className='dark:text-dark-secondary-foreground text-secondary-foreground'
      >
        <div className='container'>
          <div className='mb-6 max-w-4xl'>
            <H2
              ID='bruksomrader'
              Text='Utekos gjennom hele kvelden'
              className='dark:text-dark-secondary-foreground text-secondary-foreground'
            />
            <Lead
              Text='Fra første gjest ankommer til de siste drar — komfort
            som holder stemningen oppe.'
              className='dark:text-dark-secondary-foreground text-secondary-foreground'
            />
          </div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
            {useCases.map((useCase, caseIndex) => (
              <AnimatedBlock
                key={useCase.title}
                className='will-animate-fade-in-up h-full'
                delay={`${caseIndex * 0.1}s`}
                threshold={0.2}
              >
                <Card
                  className={`group /40 @container relative h-full overflow-hidden border-border/40 ${useCase.color}`}
                >
                  <CardContent className='relative p-8'>
                    <div className='mb-6 flex items-center gap-4'>
                      <div
                        className={`flex size-12 shrink-0 items-center justify-center rounded-full border border-foreground/18 ${useCase.iconBackground}`}
                      >
                        <useCase.icon
                          className={`size-6 ${useCase.iconColor}`}
                          aria-hidden
                        />
                      </div>
                      <p className='font-utekos-text-medium text-base tracking-[-0.02em] text-foreground'>
                        {useCase.time}
                      </p>
                    </div>

                    <h3 className='mb-2 font-utekos-text-medium text-xl leading-[1.1] tracking-[-0.01em] text-foreground'>
                      {useCase.title}
                    </h3>
                    <p className='font-utekos-text text-base tracking-[-0.02em] text-foreground'>
                      {useCase.description}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedBlock>
            ))}
          </div>
        </div>
      </article>
    </SectionBox>
  )
}
