import { Card, CardContent } from '@/components/ui/card'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import type { HostTip } from '../types'
import {
  Music,
  Thermometer,
  Lightbulb,
  UtensilsCrossed
} from 'lucide-react'
import { grillCardThemes } from '../data/grillCardThemes'
import { grillSectionSurfaces } from '../theme/sectionSurfaces'
import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'
import { SectionBox } from '@/components/layout/SectionBox'
const { dark } = grillSectionSurfaces

export const hostTipsData: HostTip[] = [
  {
    name: 'Planlegg for komfort',
    highlight: 'Ha Utekos klar til gjestene',
    icon: Thermometer
  },
  {
    name: 'God belysning',
    highlight: 'Lysslynger skaper magi',
    icon: Lightbulb
  },
  {
    name: 'Enkel servering',
    highlight: 'Fingermat og selvbetjening',
    icon: UtensilsCrossed
  },
  {
    name: 'Riktig musikk',
    highlight: 'En rolig spilleliste setter tonen',
    icon: Music
  }
]

export function HostTipsGrid({ tips }: { tips: HostTip[] }) {
  return (
    <SectionBox bgcolor='bg-maritime-darkest border-b border-border'>
      <article className={dark.section}>
        <div className='container'>
          <div className='mb-6'>
            <H2
              ID='vertens-sjekkliste'
              Text='Vertens sjekkliste'
              className={`${dark.heading}`}
            ></H2>
            <Lead
              className={`mt-4 pb-6 ${dark.lead}`}
              Text='Fire enkle tips for en uforglemmelig og komfortabel grillkveld.'
            ></Lead>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {tips.map((tip, tipIndex) => {
              const theme =
                grillCardThemes[
                  tipIndex % grillCardThemes.length
                ] ?? grillCardThemes[0]

              return (
                <AnimatedBlock
                  className='will-animate-fade-in-up h-full'
                  delay={`${tipIndex * 0.08}s`}
                  threshold={0.18}
                  key={tip.name}
                >
                  <Card
                    className={`group @container relative h-full overflow-hidden border ${theme.border} ${theme.surface} transition-[transform,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1`}
                  >
                    <div className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                      <div
                        className={`absolute inset-0 ${theme.glow}`}
                      />
                      <div className='absolute inset-x-0 top-0 h-px bg-foreground/24' />
                    </div>

                    <CardContent className='relative flex h-full flex-col p-6'>
                      <div className='mb-4 flex items-center gap-4'>
                        <div
                          className='flex size-10 shrink-0 items-center justify-center rounded-full border border-background/10 transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5'
                          style={{
                            backgroundColor: `var(${theme.iconSurface})`
                          }}
                        >
                          <tip.icon
                            className={`size-5 ${theme.iconColor}`}
                            aria-hidden
                          />
                        </div>
                        <h3
                          className={`font-utekos-text-medium text-lg leading-[1.1] tracking-[-0.01em] ${theme.text}`}
                        >
                          {tip.name}
                        </h3>
                      </div>
                      <p
                        className={`leading-text-paragraph text-sm tracking-[-0.02em] ${theme.mutedText}`}
                      >
                        {tip.highlight}
                      </p>
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
