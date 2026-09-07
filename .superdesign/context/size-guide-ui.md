# Full source bundle for Superdesign

Bundled only to satisfy the service limit of 20 context files. Every selected source file below is included in full, without thinning. Regenerate from listed sources and refresh their hashes before resuming if original code changed.

## src/app/handlehjelp/storrelsesguide/components/SizeGuideHero.tsx

```tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function SizeGuideHero() {
  return (
    <SizeGuideSectionShell
      id='size-guide-hero'
      surface='jungle'
      className='mb-4 rounded-xl border-b border-border'
    >
      <hgroup className='max-w-3xl'>
        <BrandBadge
          label=' Handlehjelp'
          bgColor='var(--background)'
          fgColor='var(--foreground)'
          className='mb-4 border border-border px-5 py-2.5 font-sans text-base tracking-wide sm:px-8 sm:py-3'
        />
        <h1 className='font-sans text-3xl leading-[1.05] font-extrabold text-foreground md:text-5xl lg:text-6xl'>
          Størrelsesguide
        </h1>
        <p className='/90 mt-5 max-w-2xl text-lg leading-relaxed text-foreground/90'>
          Riktig størrelse gir mer ro, bedre varme og en passform
          som følger deg ute. Bruk guiden til å velge trygt før
          du handler.
        </p>
      </hgroup>
    </SizeGuideSectionShell>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/SizeGuideSectionShell.tsx

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/className'

export type SizeGuideSectionSurface =
  | 'card'
  | 'background'
  | 'muted'
  | 'jungle'

type SizeGuideSectionShellProps = {
  id: string
  children: ReactNode
  surface: SizeGuideSectionSurface
  ariaLabelledby?: string
  className?: string
  contentClassName?: string
}

const contentClassNames =
  'w-full px-4 py-14 sm:px-8 sm:py-16 lg:py-20'

const surfaceClassNames: Record<
  SizeGuideSectionSurface,
  string
> = {
  card: 'bg-card text-card-foreground',
  background: 'bg-background text-foreground',
  muted: 'bg-muted text-foreground',
  jungle: 'bg-jungle text-foreground'
}

export function SizeGuideSectionShell({
  id,
  children,
  surface,
  ariaLabelledby,
  className,
  contentClassName
}: SizeGuideSectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cn(
        'scroll-mt-28',
        surfaceClassNames[surface],
        className
      )}
    >
      <div
        className={cn(
          'max-w-9xl mx-auto',
          contentClassNames,
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/TechDownSizeGuide.tsx

```tsx
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { techDownSizeCards } from '../utils/techDownSizeCards'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'
import { TechDownSizeCard } from './TechDownSizeCard'

export function TechDownSizeGuide() {
  return (
    <SizeGuideSectionShell
      id='tech-down-size-guide'
      surface='jungle'
      ariaLabelledby='tech-down-size-guide-heading'
      className='rounded-xl'
    >
      <div className='max-w-5xl'>
        <BrandBadge
          label='TechDown™'
          bgColor='var(--background)'
          fgColor='var(--foreground)'
          className='mb-5 min-w-24 border border-border px-4 py-2 text-left text-lg md:px-6 md:py-3'
        />

        <h2
          id='tech-down-size-guide-heading'
          className='font-sans pt-4 pb-6 text-3xl leading-[1.05] font-bold text-inherit md:text-5xl lg:text-6xl'
        >
          Presisjon i hver størrelse
        </h2>

        <div className='space-y-2 font-utekos-text text-lg leading-relaxed text-foreground'>
          <p>
            For livsnyteren som verdsetter både funksjon og form,
            er Utekos TechDown™ designet med en mer kroppsnær
            passform. Dette gir deg suveren bevegelsesfrihet og effektiv
            varme, pakket inn i et nettere design.
            Perfekt for et aktivt liv på hytten, i bobilen eller
            på kjølige kvelder på terrassen.
                </p>
          <p>
            Utekos TechDown™ sine størrelser har en tradisjonell
            progresjon for å sikre at du finner en størrelse som
            passer perfekt til din kroppstype. Valget ditt bør baseres på hvordan du har tenkt til å
            bruke den og hvilken passform du foretrekker for
            tekniske plagg.
        </p>
        </div>
      </div>

      <div className='mt-14 grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-6'>
        {techDownSizeCards.map(card => (
          <TechDownSizeCard key={card.id} card={card} />
        ))}
      </div>
    </SizeGuideSectionShell>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/TechDownHgroup.tsx

```tsx
import { techDownFeatures } from '../utils/techDownFeatures'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function TechDownHgroup() {
  return (
    <SizeGuideSectionShell
      id='tech-down-details'
      surface='muted'
      ariaLabelledby='tech-down-details-heading'
      className='my-4 rounded-xl'
    >
      <h2
        id='tech-down-details-heading'
        className='mb-4 max-w-4xl font-sans text-4xl leading-[1.05] font-bold text-foreground md:text-5xl lg:text-6xl'
      >
        Gjennomtenkte detaljer
      </h2>

      <div className='mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {techDownFeatures.map(feature => (
          <div
            key={feature.title}
            className='bg-jungle h-full rounded-lg border border-border p-6 text-left text-foreground shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)]'

          >
            <div className='flex items-center gap-4'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-dark-teal text-foreground'>
                <feature.Icon
                  className='size-6'
                  aria-hidden='true'
                />
              </div>
              <h3 className='font-sans text-lg font-bold'>
                {feature.title}
              </h3>
            </div>
            <p className='/90 mt-2 text-base leading-relaxed text-inherit/90'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </SizeGuideSectionShell>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/TechDownMeasurement.tsx

```tsx
import { techDownData } from '../utils/data'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function TechDownMeasurement() {
  return (
    <SizeGuideSectionShell
      id='tech-down-measurements'
      surface='jungle'
      ariaLabelledby='tech-down-measurements-heading'
      className='rounded-xl'
    >
      <h2
        id='tech-down-measurements-heading'
        className='max-w-5xl rounded-lg font-sans text-4xl leading-[1.05] font-bold text-inherit md:text-5xl lg:text-6xl'
      >
        Måletabell for TechDown™
      </h2>
      <p className='/90 mt-5 max-w-3xl text-lg leading-relaxed text-inherit/90'>
        Bruk målene som presis kontroll når du velger mellom
        Liten, Middels, Stor og Større.
      </p>

      <div className='mt-12 w-full'>
        <div
          className='w-full overflow-x-auto rounded-lg focus-visible:ring-2 focus-visible:ring-foreground/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none'
          role='region'
          aria-label='Måletabell for TechDown størrelser'
          tabIndex={0}
        >
          <div className='w-full max-lg:min-w-max'>
            <div className='overflow-hidden rounded-lg border border-border shadow-[0_22px_54px_-42px_color-mix(in_oklab,var(--background)_90%,transparent)]'>
              <table className='w-full divide-y divide-border bg-background text-foreground max-lg:min-w-2xl'>
                <thead className='bg-muted text-foreground'>
                  <tr>
                    <th
                      scope='col'
                      className='bg-muted py-3.5 pr-3 pl-4 text-left font-utekos-text-medium text-sm sm:pl-6'
                    >
                      Måling
                    </th>
                    <th
                      scope='col'
                      className='bg-muted px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Liten
                    </th>
                    <th
                      scope='col'
                      className='bg-muted px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Middels
                    </th>
                    <th
                      scope='col'
                      className='bg-muted px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Stor
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {techDownData.map(item => (
                    <tr key={item.measurement}>
                      <td className='py-4 pr-3 pl-4 text-left text-sm font-medium whitespace-nowrap text-foreground sm:pl-6'>
                        {item.measurement}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap text-foreground'>
                        {item.liten}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap text-foreground'>
                        {item.middels}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap text-foreground'>
                        {item.stor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SizeGuideSectionShell>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/TechDownSizeCard.tsx

```tsx
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
```

## src/app/handlehjelp/storrelsesguide/components/UtekosSizeGuide.tsx

```tsx
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
      surface='jungle'
      ariaLabelledby='utekos-size-guide-heading'
      className='my-4 rounded-lg'
    >
      <div className='max-w-5xl'>
        <BrandBadge
          label='Mikrofiber™'
          bgColor='var(--background)'
          fgColor='var(--foreground)'
          className='mb-5 min-w-24 place-content-start border border-border px-4 py-2 text-left text-lg md:px-6 md:py-3'
        />
        <h2
          id='utekos-size-guide-heading'
          className='pt-4 pb-6 font-sans text-3xl leading-[1.05] font-bold text-foreground md:text-5xl lg:text-6xl'
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
          Vi har designet Utekos Dun og Mikrofiber med en
          filosofi om ultimat komfort gjennom suveren
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
                  className='flex size-11 items-center justify-center rounded-full border border-foreground/15 bg-[color-mix(in_oklch,var(--background)_88%,var(--foreground)_12%)] font-sans text-lg leading-none font-bold text-foreground shadow-xs'
                >
                  {card.sizeCode}
                </span>
              </CardAction>

              <p className='font-utekos-text-medium text-sm leading-none font-medium tracking-tight text-foreground/65'>
                Utekos Mikrofiber™
              </p>

              <CardTitle className='font-sans text-2xl leading-[1.05] font-bold text-foreground md:text-3xl'>
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
```

## src/app/handlehjelp/storrelsesguide/components/ChooseRightCard.tsx

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
export function ChooseRightCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vårt beste tips for å velge riktig</CardTitle>
      </CardHeader>
      <CardDescription>
        Tenk på hvordan du vil bruke plagget. Ønsker du en
        passform som er romslig, men som følger deg? Velg din
        normale størrelse. Ser du for deg maksimal plass til
        tykke lag under, eller en bevisst overdimensjonert stil?
        Da kan du vurdere å gå opp en størrelse. Det er ingen
        fasit – det viktigste er hva du føler deg mest
        komfortabel i.
      </CardDescription>
    </Card>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/AdaptSection.tsx

```tsx
import { utekosData } from '../utils/data'
import { adaptFeatures } from '../utils/features'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function AdaptSection() {
  return (
    <SizeGuideSectionShell
      id='utekos-measurements'
      surface='jungle'
      ariaLabelledby='utekos-measurements-heading'
      className='rounded-lg'
    >
      <h2
        id='utekos-measurements-heading'
        className='font-google-sans max-w-4xl font-sans text-4xl leading-[1.05] font-bold text-inherit md:text-5xl lg:text-6xl'
      >
        Skapt for å tilpasses
      </h2>

      <div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {adaptFeatures.map(feature => (
          <div
            key={feature.title}
            className='h-full rounded-xl border border-border bg-background p-6 text-left text-foreground shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)]'
          >
            <div className='flex items-center gap-4'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-full bg-jungle text-foreground'>
                <feature.Icon
                  className='size-6'
                  aria-hidden='true'
                />
              </div>
              <h3 className='font-utekos-text-medium text-lg'>
                {feature.title}
              </h3>
            </div>
            <p className='/90 mt-2 text-base leading-relaxed text-foreground/90'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className='mt-12 w-full'>
        <div
          className='w-full overflow-x-auto rounded-lg text-left focus-visible:ring-2 focus-visible:ring-foreground/80 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none'
          role='region'
          aria-label='Måletabell for Utekos Dun og Mikrofiber størrelser'
          tabIndex={0}
        >
          <div className='w-full max-lg:min-w-max'>
            <div className='overflow-hidden rounded-lg border border-border shadow-[0_22px_54px_-42px_color-mix(in_oklab,var(--background)_90%,transparent)]'>
              <table className='w-full divide-y divide-border bg-background text-foreground max-lg:min-w-xl'>
                <thead className='bg-night text-foreground'>
                  <tr>
                    <th
                      scope='col'
                      className='bg-night py-3.5 pr-3 pl-4 text-left font-utekos-text-medium text-sm sm:pl-6'
                    >
                      Måling
                    </th>
                    <th
                      scope='col'
                      className='bg-night px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Medium
                    </th>
                    <th
                      scope='col'
                      className='bg-night px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Large
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {utekosData.map(item => (
                    <tr
                      key={item.measurement}
                      className='transition-colors hover:bg-muted/35'
                    >
                      <td className='py-4 pr-3 pl-4 text-left font-utekos-text-medium text-sm whitespace-nowrap text-foreground sm:pl-6'>
                        {item.measurement}
                      </td>
                      <td className='px-3 py-4 text-center text-sm font-medium whitespace-nowrap text-foreground'>
                        {item.m}
                      </td>
                      <td className='px-3 py-4 text-center text-sm font-medium whitespace-nowrap text-foreground'>
                        {item.l}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SizeGuideSectionShell>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/ComfyrobeSizeGuide.tsx

```tsx
import {
  ArrowDown,
  Check,
  Expand,
  Footprints,
  GitCommitVertical,
  PackageOpen,
  Ruler
} from 'lucide-react'

import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { comfyrobeData } from '../utils/data'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'

const comfyrobeFeatures = [
  {
    Icon: Expand,
    title: 'Romslig og beskyttende',
    description:
      'Den rektangulære unisex-passformen er bevisst romslig for å enkelt passe over alt fra våte klær til en tykk genser.'
  },
  {
    Icon: Footprints,
    title: 'Full bevegelsesfrihet',
    description:
      'Splitt i sidene og bak sikrer at du kan bevege deg fritt, enten du går tur, klatrer eller bare strekker deg etter kaffekoppen.'
  },
  {
    Icon: PackageOpen,
    title: 'Gjennomtenkt oppbevaring',
    description:
      'To varme, fôrede sidelommer holder hendene dine lune, mens en trygg innerlomme tar vare på verdisakene dine.'
  },
  {
    Icon: GitCommitVertical,
    title: 'Toveis YKK®-glidelås',
    description:
      'Gir deg full kontroll over ventilasjon og gjør av- og påkledning enkelt, selv når du har hendene fulle.'
  }
]

const comfyrobeSizeCards = [
  {
    id: 'xs',
    sizeCode: 'XS',
    heading: 'Velg XS hvis...',
    fitGuidance: [
      'Du bruker vanligvis small og vil beholde den korteste og minst voluminøse Comfyrobe-passformen.',
      'Du ønsker romslig komfort, men uten ekstra lengde og bredde.'
    ]
  },
  {
    id: 'm/l',
    sizeCode: 'ML',
    heading: 'Velg M hvis...',
    fitGuidance: [
      'Du bruker vanligvis medium og ønsker den mest balanserte allværs-passformen.',
      'Du vil bruke Comfyrobe uten behov for et ekstra lag med klær under'
    ]
  },
  {
    id: 'xl',
    sizeCode: 'XL',
    heading: 'Velg XL hvis...',
    fitGuidance: [
      'Du bruker vanligvis large, eller bevisst ønsker en mer overdimensjonert følelse.',
      'Du prioriterer maksimal dekning rundt kropp, skuldre og hette.'
    ]
  }
] as const

export function ComfyrobeSizeGuide() {
  return (
    <SizeGuideSectionShell
      id='comfyrobe-size-guide'
      surface='muted'
      ariaLabelledby='comfyrobe-size-guide-heading'
      className='my-4 rounded-lg'
    >
      <div className='max-w-5xl'>
        <BrandBadge
          label='Comfyrobe™'
          bgColor='var(--card)'
          fgColor='var(--card-foreground)'
          className='mb-5 min-w-24 border border-border px-4 py-2 text-left text-lg md:px-6 md:py-3'
        />
        <h2
          id='comfyrobe-size-guide-heading'
          className='font-sans text-3xl leading-[1.05] font-extrabold text-foreground md:text-5xl lg:text-6xl'
        >
          Størrelsesguide for Comfyrobe™
        </h2>

        <p className='/90 mt-12 max-w-4xl text-lg leading-relaxed text-foreground/90'>
          Comfyrobe™ er designet som ditt personlige, beskyttende
          skall. Den romslige, rektangulære passformen er ment å
          være omsluttende og komfortabel, ikke figurnær.
          Hensikten er at den enkelt skal kunne trekkes over alt
          du har på deg, samtidig som smarte detaljer sikrer deg
          full bevegelsesfrihet.
        </p>
      </div>

      <div className='mt-12 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {comfyrobeFeatures.map(feature => (
          <div
            key={feature.title}
            className='h-full rounded-lg border border-border bg-jungle p-6 text-left text-foreground shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)]'
          >
            <div className='flex items-center gap-4'>
              <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-dark-teal text-foreground'>
                <feature.Icon
                  className='size-5'
                  aria-hidden='true'
                />
              </div>
              <h3 className='font-sans text-lg'>
                {feature.title}
              </h3>
            </div>
            <p className='/90 mt-2 text-sm leading-relaxed text-inherit/90'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className='mt-14 grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-6'>
        {comfyrobeSizeCards.map(card => (
          <Card
            key={card.id}
            aria-labelledby={`comfyrobe-size-${card.id}-heading`}
            className='relative isolate h-full gap-0 overflow-hidden border border-border bg-background py-0 text-foreground shadow-[0_24px_64px_-48px_color-mix(in_oklab,var(--foreground)_30%,transparent)] ring-0 transition-[border-color,box-shadow] duration-300 hover:border-foreground/20 hover:shadow-[0_28px_72px_-50px_color-mix(in_oklab,var(--foreground)_42%,transparent)]'
          >
            <CardHeader className='gap-3 border-b border-border bg-background px-5 pt-7 pb-6 sm:px-6'>
              <CardAction>
                <span
                  aria-hidden='true'
                  className='font-google-sans flex size-11 items-center justify-center rounded-full border border-foreground/15 bg-jungle font-sans text-lg leading-none font-bold text-foreground shadow-xs'
                >
                  {card.sizeCode}
                </span>
              </CardAction>

              <p className='font-utekos-text-medium text-sm leading-none font-medium tracking-tight text-foreground/65'>
                Comfyrobe™
              </p>

              <CardTitle className='font-sans text-2xl leading-[1.05] font-bold text-foreground md:text-3xl'>
                <h3
                  id={`comfyrobe-size-${card.id}-heading`}
                  className='font-sans'
                >
                  {card.heading}
                </h3>
              </CardTitle>
            </CardHeader>

            <CardContent className='flex flex-1 flex-col px-5 py-6 sm:px-6'>
              <ul role='list' className='space-y-4'>
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

            <CardFooter className='mt-auto bg-jungle px-5 py-0 sm:px-6'>
              <div className='w-full border-t border-border py-3'>
                <a
                  href='#comfyrobe-measurements'
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

      <div
        id='comfyrobe-measurements'
        className='mt-12 w-full scroll-mt-24'
      >
        <div
          className='w-full overflow-x-auto rounded-lg focus-visible:ring-2 focus-visible:ring-foreground/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none'
          role='region'
          aria-label='Måletabell for Comfyrobe størrelser'
          tabIndex={0}
        >
          <div className='w-full max-lg:min-w-max'>
            <div className='overflow-hidden rounded-lg border border-border shadow-[0_18px_44px_-36px_color-mix(in_oklab,var(--background)_72%,transparent)]'>
              <table className='w-full divide-y divide-border bg-jungle text-foreground max-lg:min-w-176'>
                <thead className='text-foreground bg-background'>
                  <tr>
                    <th
                      scope='col'
                      className='bg-background py-3.5 pr-3 pl-4 text-left font-utekos-text-medium text-sm sm:pl-6'
                    >
                      Måling
                    </th>
                    <th
                      scope='col'
                      className='bg-background px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Small
                    </th>
                    <th
                      scope='col'
                      className='bg-background px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Medium
                    </th>
                    <th
                      scope='col'
                      className='bg-background px-3 py-3.5 text-center font-utekos-text-medium text-sm'
                    >
                      Large
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border bg-jungle text-foreground'>
                  {comfyrobeData.map(row => (
                    <tr key={row.measurement}>
                      <td className='py-4 pr-3 pl-4 text-left text-sm font-medium whitespace-nowrap sm:pl-6'>
                        {row.measurement}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap'>
                        {row.xs}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap'>
                        {row.ml}
                      </td>
                      <td className='px-3 py-4 text-center text-sm whitespace-nowrap'>
                        {row.lxl}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </SizeGuideSectionShell>
  )
}
```

## src/app/handlehjelp/storrelsesguide/components/BackToShopCta.tsx

```tsx
import { SizeGuideSectionShell } from './SizeGuideSectionShell'
import type { SizeGuideSectionSurface } from './SizeGuideSectionShell'
import { LazyFeaturedProductCarousel } from '@/components/ProductCard/LazyFeaturedProductCarousel'
import { cn } from '@/lib/utils/className'

export async function BackToShopCta({
  className,
  surface = 'background'
}: {
  className?: string
  surface?: SizeGuideSectionSurface
} = {}) {
  return (
    <SizeGuideSectionShell
      id='size-guide-cta'
      surface={surface}
      ariaLabelledby='size-guide-cta-heading'
      className={cn(
        'mt-4 mb-12 rounded-xl border-t border-border lg:mb-16',
        className
      )}
      contentClassName='rounded-xl py-8 sm:py-8 md:px-8 md:py-12 lg:px-12 lg:py-12'
    >
      <div className='mx-auto w-full bg-transparent text-left lg:max-w-7xl'>
        <div className='mb-8 rounded-lg py-2 text-left shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)] sm:py-8'>
          <h2
            id='size-guide-cta-heading'
            className='text-left font-sans text-3xl leading-[1.05] font-extrabold text-inherit sm:text-5xl md:text-5xl lg:text-6xl'
          >
            Klar for å kjøpe din Utekos?
          </h2>
        </div>
        <LazyFeaturedProductCarousel />
      </div>
    </SizeGuideSectionShell>
  )
}
```

