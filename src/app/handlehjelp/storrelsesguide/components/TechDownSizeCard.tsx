import { ArrowDown, Check, Info, Ruler } from 'lucide-react'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { TechDownSizeCardData } from '../utils/techDownSizeCards'

type TechDownSizeCardProps = { card: TechDownSizeCardData }

export function TechDownSizeCard({
  card
}: TechDownSizeCardProps) {
  const headingId = `tech-down-size-${card.id}-heading`

  return (
    <Card
      aria-labelledby={headingId}
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

        <p className='font-utekos-text-medium text-sm leading-none font-medium tracking-tight text-foreground/90'>
          Utekos TechDown™
        </p>

        <CardTitle className='font-google-sans font-sans text-2xl leading-[1.05] font-bold text-foreground md:text-3xl'>
          <h3 id={headingId}>{card.heading}</h3>
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

        {card.importantNote ?
          <div className='mt-6 flex gap-3 rounded-lg border border-border bg-secondary/55 p-4'>
            <Info
              aria-hidden='true'
              className='mt-0.5 size-4 shrink-0 text-foreground/70'
            />

            <p className='font-utekos-text text-sm leading-relaxed text-foreground/85'>
              <span className='font-utekos-text-medium font-medium text-foreground'>
                Viktig:
              </span>{' '}
              {card.importantNote}
            </p>
          </div>
        : null}
      </CardContent>

      <CardFooter className='mt-auto bg-[color-mix(in_oklch,var(--background)_88%,var(--foreground)_12%)] px-5 py-0 sm:px-6'>
        <div className='w-full border-t border-border py-3'>
          <a
            href='#tech-down-measurements'
            className='group/link inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-md font-utekos-text-medium text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none'
          >
            <span className='inline-flex items-center gap-2'>
              <Ruler aria-hidden='true' className='size-4' />
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
  )
}
