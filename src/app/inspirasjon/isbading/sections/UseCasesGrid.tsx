// Path: src/app/inspirasjon/isbading/sections/UseCasesGrid.tsx

import { Card, CardContent } from '@/components/ui/card'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import { Car, Coffee, Users } from 'lucide-react'
import type { UseCase } from '../types'

export const useCasesData: UseCase[] = [
  {
    icon: Users,
    time: 'Før/Etter dykket',
    title: 'Skiftesonen',
    description:
      'Trekk armene inn i varmen og skift av deg vått badetøy uten å bli eksponert for vær og vind.',
    temperature: '-15 til 5°C',
    color: 'from-ancient-water/20',
    iconColor: 'text-ancient-water'
  },
  {
    icon: Car,
    time: 'Transport',
    title: 'Turen hjem',
    description:
      'Sett deg rett i bilen med Utekos på. Beskytt bilsetet mot fukt og behold varmen hele veien hjem.',
    temperature: 'Kald vind',
    color: 'from-blue-600/20',
    iconColor: 'text-ancient-water'
  },
  {
    icon: Coffee,
    time: 'Debrief',
    title: 'Kaffen etterpå',
    description:
      'Nyt den sosiale stunden med badeklubben etter badet, mens kroppen jobber seg tilbake til varmen.',
    temperature: 'Alle forhold',
    color: 'from-primary/20 dark:from-dark-primary/20',
    iconColor: 'text-primary dark:text-dark-primary'
  }
]

export function UseCasesGrid({
  useCases
}: {
  useCases: UseCase[]
}) {
  return (
    <article id='bruksomrader' className='bg-overcast py-24'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto mb-16 max-w-2xl text-center'>
          <h2 className='text-fluid-display dark:text-dark-background font-google-sans font-bold tracking-normal text-background'>
            Fra forberedelse til varmen
          </h2>
          <p className='mt-4 text-lg text-ancient-water'>
            Isbading handler om ritualer. Utekos gjør hvert steg
            i prosessen mer behagelig.
          </p>
        </div>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
          {useCases.map((useCase, useCaseIndex) => (
            <AnimatedBlock
              key={useCase.title}
              className='will-animate-fade-in-up'
              delay={`${useCaseIndex * 0.1}s`}
              threshold={0.2}
            >
              <Card className='group dark:bg-dark-background @container relative h-full overflow-hidden border-foreground/12 bg-background'>
                <div
                  className={`absolute inset-0 bg-linear-to-br ${useCase.color} to-transparent opacity-20 transition-opacity group-hover:opacity-30`}
                />
                <CardContent className='relative p-8'>
                  <div className='mb-6 flex items-center gap-4'>
                    <div className='dark:bg-dark-background/58 flex size-12 items-center justify-center rounded-lg border border-foreground/18 bg-background/58'>
                      <useCase.icon
                        className={`size-6 ${useCase.iconColor}`}
                      />
                    </div>
                    <div>
                      <p className='text-sm text-ancient-water'>
                        {useCase.time}
                      </p>
                      <p className='text-sm font-medium text-foreground'>
                        {useCase.temperature}
                      </p>
                    </div>
                  </div>
                  <h3 className='mb-2 font-utekos-text-medium text-xl text-foreground'>
                    {useCase.title}
                  </h3>
                  <p className='text-ancient-water'>
                    {useCase.description}
                  </p>
                </CardContent>
              </Card>
            </AnimatedBlock>
          ))}
        </div>
      </div>
    </article>
  )
}
