// Path: src/app/inspirasjon/terrassen/sections/TerraceIdeasGrid.tsx

import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Building2, Coffee, Sofa } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { H2 } from '@/components/typography/TypographyH2'
import { H3 } from '@/components/typography/TypographyH3'
import { Lead } from '@/components/typography/Lead'
import { P } from '@/components/typography/TypographyP'
import { MotionCard, MotionReveal } from './TerraceMotion'

type TerraceIdea = {
  name: string
  highlight: string
  icon: LucideIcon
}

export const terraceIdeasData: TerraceIdea[] = [
  {
    name: 'Morgenkaffen ute',
    highlight: 'En lun start på dagen',
    icon: Coffee
  },
  {
    name: 'Lounge-området',
    highlight: 'For sosiale kvelder',
    icon: Sofa
  },
  {
    name: 'Balkong-oasen',
    highlight: 'Maksimal komfort, minimal plass',
    icon: Building2
  },
  {
    name: 'Lesekroken',
    highlight: 'Fordyp deg i en annen verden',
    icon: BookOpen
  }
]

export function TerraceIdeasGrid({
  ideas
}: {
  ideas: TerraceIdea[]
}) {
  return (
    <article className='bg-[var(--terrace-cream)] py-24 text-[var(--terrace-ink)] md:py-32'>
      <div className='container mx-auto px-4'>
        <MotionReveal className='mb-16 max-w-3xl md:max-w-4xl'>
          <H2
            ID='terrasse-ideer'
            Text='Ideer for din uteplass'
            className='pb-0 text-left text-[clamp(3rem,6vw,5.75rem)] leading-[0.95] text-[var(--terrace-ink)]'
          />
          <Lead className='mt-5 max-w-2xl pb-0 text-left text-lg leading-relaxed text-[var(--terrace-muted)] md:pb-0 md:text-xl lg:pb-0 lg:text-xl'>
            Uansett størrelse på uteplassen din, kan den bli en
            oase for komfort og hygge.
          </Lead>
        </MotionReveal>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {ideas.map((idea, index) => {
            const Icon = idea.icon

            return (
              <MotionCard
                key={idea.name}
                delay={index * 0.07}
              >
                <Card className='group h-full rounded-lg border-none bg-jungle text-[var(--terrace-cream)] shadow-[0_28px_78px_-60px_rgb(16_32_31/0.82)] ring-0 transition-colors duration-300 hover:brightness-110 motion-reduce:transition-none'>
                  <CardContent className='p-6'>
                    <div className='mb-3 flex items-center gap-3'>
                      <div className='flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--terrace-line-dark)] bg-dark-teal text-foreground'>
                        <Icon
                          className='size-5'
                          aria-hidden='true'
                        />
                      </div>
                      <H3
                        Text={idea.name}
                        className='pb-0 text-xl leading-[1.08] text-[var(--terrace-cream)] md:text-2xl'
                      />
                    </div>
                    <P className='mt-4 text-left leading-relaxed text-[var(--terrace-sage-soft)] not-first:mt-4'>
                      {idea.highlight}
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
