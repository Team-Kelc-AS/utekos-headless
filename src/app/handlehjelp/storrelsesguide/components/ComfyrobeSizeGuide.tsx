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
  CardDescription,
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
    measurementGuide: '97 cm total lengde, 65 cm brystbredde.',
    fitGuidance: [
      'Du bruker vanligvis small og vil beholde den korteste og minst voluminøse Comfyrobe-passformen.',
      'Du ønsker romslig komfort, men uten ekstra lengde og bredde.'
    ]
  },
  {
    id: 'm/l',
    sizeCode: 'ML',
    heading: 'Velg M hvis...',
    measurementGuide: '105 cm total lengde, 71 cm brystbredde.',
    fitGuidance: [
      'Du bruker vanligvis medium og ønsker den mest balanserte allværs-passformen.',
      'Du vil bruke Comfyrobe uten behov for et ekstra lag med klær under'
    ]
  },
  {
    id: 'xl',
    sizeCode: 'XL',
    heading: 'Velg XL hvis...',
    measurementGuide: '113 cm total lengde, 77 cm brystbredde.',
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
              <h3 className='font-sans font-utekos-text-medium text-lg'>
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

              <CardDescription className='mt-1 flex items-start gap-2 font-utekos-text text-sm leading-relaxed tracking-normal text-foreground/75'>
                <Ruler
                  aria-hidden='true'
                  className='mt-0.5 size-4 shrink-0 text-foreground/65'
                />

                <span>
                  <span className='font-utekos-text-medium font-medium text-foreground'>
                    Målreferanse:
                  </span>{' '}
                  {card.measurementGuide}
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
