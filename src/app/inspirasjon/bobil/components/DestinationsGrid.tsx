import { AnimatedBlock } from '@/components/AnimatedBlock'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import type { Destination } from '../types'
import { bobilDestinationCardTheme as theme } from '../utils/destinationCardThemes'
import { SectionBox } from '@/components/layout/SectionBox'
import { H2 } from '@/components/typography/TypographyH2'
import { Lead } from '@/components/typography/Lead'
import { P } from '@/components/typography/TypographyP'
import { H3 } from '@/components/typography/TypographyH3'

export function DestinationsGrid({
  destinations
}: {
  destinations: Destination[]
}) {
  return (
    <SectionBox bgcolor='bg-jungle text-foreground'>
      <article className='w-full text-foreground'>
        <div className='container px-4'>
          <div className='mb-6 md:mb-8 lg:mb-10'>
            <H2
              Text='Populære destinasjoner med Utekos'
              ID='populære-destinasjoner-med-utekos'
              className='text-foreground'
            />
            <Lead
              Text='Norges vakreste bobildestinasjoner venter — nyt dem i komfort hele sesongen'
              className='text-foreground'
            />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
            {destinations.map(
              (destination, destinationIndex) => {
                const Icon = destination.icon

                return (
                  <AnimatedBlock
                    key={destination.name}
                    className='will-animate-fade-in-up h-full'
                    delay={`${destinationIndex * 0.08}s`}
                    rootMargin='0px 0px -8% 0px'
                    threshold={0.18}
                  >
                    <div
                      className={`group relative flex h-full min-h-72 flex-col overflow-hidden rounded-xl border transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 ${theme.border} ${theme.surface} ${theme.text}`}
                      style={
                        {
                          '--pattern-fg': theme.patternForeground
                        } as React.CSSProperties
                      }
                    >
                      <div
                        className='pointer-events-none absolute inset-0 z-0'
                        aria-hidden='true'
                      >
                        <div className='absolute inset-y-0 left-0 w-5 border-r border-(--pattern-fg) bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] sm:w-6' />

                        <div className='absolute inset-y-0 right-0 w-5 border-l border-(--pattern-fg) bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] sm:w-6' />

                        <div className='absolute inset-x-0 top-0 h-px bg-(--pattern-fg)' />
                        <div className='absolute inset-x-0 bottom-0 h-px bg-(--pattern-fg)' />
                      </div>

                      <div
                        className='pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                        aria-hidden='true'
                      >
                        <div
                          className={`absolute inset-0 ${theme.glow}`}
                        />
                        <div className='absolute inset-x-0 top-0 h-px bg-foreground/24 dark:bg-dark-foreground/24' />
                      </div>

                      <div className='relative z-10 flex grow flex-col px-8 py-5 sm:px-9 sm:py-6'>
                        <div className='mb-5 flex min-w-0 items-start gap-4'>
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5 ${theme.iconBackground}`}
                          >
                            <Icon
                              className={`size-5 transition-colors duration-300 ${theme.iconText}`}
                              aria-hidden='true'
                            />
                          </div>

                          <H3
                            Text={destination.name}
                            className={`min-w-0 flex-1 pb-0 text-lg leading-tight tracking-[-0.01em] break-words hyphens-auto sm:text-xl md:text-xl ${theme.text}`}
                          />
                        </div>

                        <P
                          Text={destination.highlight}
                          className={`mb-0 text-sm leading-relaxed tracking-[-0.02em] ${theme.mutedText}`}
                        />

                        <div className='mt-auto pt-5'>
                          <BrandBadge
                            label={destination.season}
                            backgroundColor={
                              theme.badgeBackground
                            }
                            textColor={theme.badgeText}
                          />
                        </div>
                      </div>
                    </div>
                  </AnimatedBlock>
                )
              }
            )}
          </div>
        </div>
      </article>
    </SectionBox>
  )
}
