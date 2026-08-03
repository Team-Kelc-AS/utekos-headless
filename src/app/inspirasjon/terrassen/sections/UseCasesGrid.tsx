// Path: src/app/inspirasjon/terrassen/sections/UseCasesGrid.tsx

import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Coffee, Moon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { Lead } from '@/components/typography/Lead'
import { P } from '@/components/typography/TypographyP'
import { MotionCard, MotionReveal } from './TerraceMotion'

type UseCase = {
  icon: LucideIcon
  time: string
  title: string
  description: string
}

export const useCasesData: UseCase[] = [
  {
    icon: Coffee,
    time: 'Morgen',
    title: 'Den første vårkaffen',
    description:
      'Start dagen i frisk luft uten å fryse. Nyt roen før resten av verden våkner.'
  },
  {
    icon: Moon,
    time: 'Kveld',
    title: 'Sene sommerkvelder',
    description:
      'Ikke la duggfallet jage deg inn. Forleng de gode samtalene under stjernene.'
  },
  {
    icon: BookOpen,
    time: 'Ettermiddag',
    title: 'En rolig lesestund',
    description:
      'Finn roen med en god bok og en kopp te på en kjølig høstdag, pakket inn i varme.'
  }
]

export function UseCasesGrid({
  useCases
}: {
  useCases: UseCase[]
}) {
  return (
    <article
      id='bruksomrader'
      className='bg-[var(--terrace-paper)] py-24 text-[var(--terrace-ink)] md:py-32'
    >
      <div className='container mx-auto px-4'>
        <MotionReveal className='mb-16 max-w-3xl lg:max-w-4xl'>
          <H2
            ID='terrasse-hjemmekos'
            Text='Hjemmekos, bare ute'
            className='pb-0 text-left text-[clamp(3rem,6vw,5.75rem)] leading-[0.95] text-[var(--terrace-ink)]'
          />
          <Lead className='mt-6 max-w-2xl pb-0 text-left text-[var(--terrace-muted)] md:pb-0 lg:pb-0'>
            Fra en stille stund for deg selv, til sosiale lag som
            varer lenger.
          </Lead>
        </MotionReveal>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon

            return (
              <MotionCard
                key={useCase.title}
                delay={index * 0.08}
              >
                <Card className='group @container h-full overflow-hidden rounded-lg border border-[var(--terrace-line-dark)] bg-jungle text-[var(--terrace-cream)] shadow-[0_24px_70px_-58px_rgb(16_32_31/0.58)] transition-colors duration-300 hover:brightness-110 motion-reduce:transition-none'>
                  <CardContent className='relative p-8'>
                    <div className='mb-6 flex items-center gap-4'>
                      <div className='flex size-12 items-center justify-center rounded-lg border border-[var(--terrace-line-dark)] bg-dark-teal text-foreground'>
                        <Icon
                          className='size-6'
                          aria-hidden='true'
                        />
                      </div>
                      <P className='text-left font-utekos-text-medium leading-[1.35] text-[var(--terrace-copper)] not-first:mt-0'>
                        {useCase.time}
                      </P>
                    </div>
                    <H3
                      Text={useCase.title}
                      className='pb-0 text-left text-xl leading-[1.08] text-[var(--terrace-cream)] md:text-2xl'
                    />
                    <P className='mt-4 leading-relaxed text-[var(--terrace-sage-soft)] not-first:mt-4'>
                      {useCase.description}
                    </P>
                  </CardContent>
                </Card>
              </MotionCard>
            )
          })}
        </div>
      </div>
    </article>
  )
}
