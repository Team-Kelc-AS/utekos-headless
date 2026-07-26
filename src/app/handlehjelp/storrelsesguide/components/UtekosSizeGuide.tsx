import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ArrowDown, Check, Ruler } from 'lucide-react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { utekosSizeCards } from '../utils/utekosSizeCards'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function UtekosSizeGuide() {
  return (
    <SizeGuideSectionShell
      id='utekos-size-guide'
      surface='muted'
      ariaLabelledby='utekos-size-guide-heading'
      className='my-4 rounded-lg'
    >
      <div className='max-w-5xl'>
        <BrandBadge
          label='Mikrofiber™'
          bgColor='var(--card)'
          fgColor='var(--card-foreground)'
          className='mb-5 min-w-24 place-content-start border border-border px-4 py-2 text-left text-lg md:px-6 md:py-3'
        />
        <h2
          id='utekos-size-guide-heading'
          className='font-google-sans pt-4 pb-6 text-3xl leading-[1.05] font-bold text-foreground md:text-5xl lg:text-6xl'
        >
          En unik tilnærming til passform
        </h2>

        <p className='/90 max-w-3xl font-utekos-text text-2xl leading-tight text-foreground/90'>
          Mer enn bare en størrelse. <br />
          En garanti for komfort gjennom suveren tilpasningsevne.
        </p>
      </div>

      <div className='brand-tracking-normal /90 mt-12 max-w-5xl space-y-6 text-left font-utekos-text text-lg leading-relaxed text-foreground/90'>
        <p>
          Vi har designet Utekos Dun og Mikrofiber med en unik
          filosofi: ultimat komfort gjennom suveren
          tilpasningsevne. Du vil legge merke til at spranget fra
          Medium til Large er betydelig – dette er helt bevisst.
          Målet er ikke at du skal finne en størrelse som{' '}
          <em>nesten</em> passer, men en som du kan forme
          nøyaktig slik du vil ha den, uansett anledning.
        </p>
        <p>
          Hemmeligheten ligger i de smarte justeringsmulighetene
          som lar deg skreddersy passformen etter vær, antrekk og
          humør.
        </p>
      </div>

      <div className='mt-14 grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6'>
        {utekosSizeCards.map(card => (
          <Card
            key={card.id}
            aria-labelledby={`utekos-size-${card.id}-heading`}
            className='relative isolate h-full gap-0 overflow-hidden border border-border bg-background py-0 text-foreground shadow-[0_24px_64px_-48px_color-mix(in_oklab,var(--foreground)_30%,transparent)] ring-0 transition-[border-color,box-shadow] duration-300 hover:border-foreground/20 hover:shadow-[0_28px_72px_-50px_color-mix(in_oklab,var(--foreground)_42%,transparent)]'
          >
            <CardHeader className='gap-3 border-b border-border bg-background px-5 pt-7 pb-6 sm:px-6'>
              <CardAction>
                <span
                  aria-hidden='true'
                  className='font-google-sans flex size-11 items-center justify-center rounded-full border border-foreground/15 bg-[color-mix(in_oklch,var(--background)_88%,var(--foreground)_12%)] font-sans text-lg leading-none font-bold text-foreground shadow-xs'
                >
                  {card.sizeCode}
                </span>
              </CardAction>

              <p className='font-utekos-text-medium text-sm leading-none font-medium tracking-tight text-foreground/65'>
                Utekos Mikrofiber™
              </p>

              <CardTitle className='font-google-sans font-sans text-2xl leading-[1.05] font-bold text-foreground md:text-3xl'>
                <h3 id={`utekos-size-${card.id}-heading`}>
                  {card.heading}
                </h3>
              </CardTitle>

              <CardDescription className='mt-1 flex items-start gap-2 font-utekos-text text-sm leading-relaxed tracking-normal text-foreground/75'>
                <Ruler
                  aria-hidden='true'
                  className='mt-0.5 size-4 shrink-0 text-foreground/65'
                />

                <span>
                  <span className='font-utekos-text-medium font-medium text-foreground'>
                    Du er:
                  </span>{' '}
                  {card.heightGuide}
                </span>
              </CardDescription>
            </CardHeader>

            <CardContent className='flex flex-1 flex-col px-5 py-6 sm:px-6'>
              <p className='font-utekos-text-medium text-sm leading-snug font-medium text-foreground'>
                Passer særlig godt når:
              </p>

              <ul role='list' className='mt-4 space-y-4'>
                {card.fitGuidance.map(item => (
                  <li
                    key={item}
                    className='flex items-start gap-3 font-utekos-text text-base leading-relaxed text-foreground/90'
                  >
                    <span className='mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-foreground/15 bg-[color-mix(in_oklch,var(--background)_88%,var(--foreground)_12%)] text-foreground'>
                      <Check
                        aria-hidden='true'
                        className='size-3.5'
                        strokeWidth={2.5}
                      />
                    </span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className='mt-auto bg-[color-mix(in_oklch,var(--background)_88%,var(--foreground)_12%)] px-5 py-0 sm:px-6'>
              <div className='w-full border-t border-border py-3'>
                <a
                  href='#utekos-measurements'
                  className='group/link inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-md font-utekos-text-medium text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none'
                >
                  <span className='inline-flex items-center gap-2'>
                    <Ruler
                      aria-hidden='true'
                      className='size-4'
                    />
                    Se måletabellen
                  </span>

                  <ArrowDown
                    aria-hidden='true'
                    className='size-4 transition-transform group-hover/link:translate-y-0.5 motion-reduce:transition-none'
                  />
                </a>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </SizeGuideSectionShell>
  )
}
