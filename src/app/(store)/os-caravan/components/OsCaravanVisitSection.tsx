import { Suspense } from 'react'
import { connection } from 'next/server'
import { MoveRightIcon } from '@/components/animate-icons/icons/move-right'
import { Button } from '@/components/ui/button'
import { OS_CARAVAN_VENUE } from '../constants/venue'
import { fetchOsCaravanVisitFacts } from '../server/fetchOsCaravanVisitFacts'
import { fetchOsCaravanWeather } from '../server/fetchOsCaravanWeather'
import { createOsCaravanMapEmbedUrl } from '../utils/createOsCaravanMapEmbedUrl'
import type { OsCaravanWeather } from '../utils/parseOsCaravanWeather'
import { describeOsCaravanOpenState } from '../utils/parseOsCaravanVisitFacts'
import { NbccReveal } from './NbccReveal'

function formatCelsius(value: number): string {
  return `${value}\u00a0°`
}

function WeatherIcon({ src }: { src: string }) {
  return (
    // Weather icons are themed SVGs from Google Weather when that
    // source is used; next/image is not configured for maps.gstatic.com.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=''
      width={40}
      height={40}
      aria-hidden
      className='size-10 shrink-0'
    />
  )
}

function OsCaravanWeatherSkeleton() {
  return (
    <div
      className='mt-10 border-t border-foreground/15 pt-8'
      aria-hidden
    >
      <div className='h-16 w-40 animate-pulse rounded-md bg-foreground/10' />
      <div className='mt-8 grid grid-cols-2 gap-px bg-foreground/12 sm:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className='h-28 animate-pulse bg-night'
          />
        ))}
      </div>
    </div>
  )
}

function OsCaravanWeatherStrip({
  weather,
  airQualityLabel
}: {
  weather: OsCaravanWeather
  airQualityLabel: string | null
}) {
  return (
    <div className='mt-10 border-t border-foreground/15 pt-8'>
      <p className='font-sans font-semibold text-base text-foreground'>
        Værmelding på Os
      </p>
      <div className='mt-5 flex flex-wrap items-end gap-x-6 gap-y-3'>
        <p className='font-sans font-semibold text-6xl leading-none tracking-[-0.04em] text-foreground'>
          <span className='sr-only'>Nå </span>
          {formatCelsius(weather.current.celsius)}
        </p>
        <div className='flex items-center gap-3 pb-1'>
          {weather.current.iconSrc ?
            <WeatherIcon src={weather.current.iconSrc} />
          : null}
          <p className='font-sans text-base text-foreground'>
            {weather.current.description}
            {weather.source === 'google' ?
              <span className='block text-sm text-foreground/75'>
                Føles som{' '}
                {formatCelsius(weather.current.feelsLikeCelsius)}
              </span>
            : null}
            {airQualityLabel ?
              <span className='block text-sm text-foreground/75'>
                {airQualityLabel}
              </span>
            : null}
          </p>
        </div>
      </div>

      <ol className='mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-foreground/12 pt-6 sm:grid-cols-5 sm:gap-x-0'>
        {weather.days.map((day, index) => (
          <li
            key={day.key}
            className={
              index === 0 ?
                'sm:pr-5'
              : 'sm:border-l sm:border-foreground/12 sm:px-5'
            }
          >
            <p className='font-sans font-semibold text-sm text-foreground'>
              {day.label}
            </p>
            <div className='mt-3 flex items-center gap-2'>
              {day.iconSrc ? <WeatherIcon src={day.iconSrc} /> : null}
              <p className='font-sans text-sm text-foreground'>
                {day.description}
              </p>
            </div>
            <p className='mt-3 font-sans text-sm text-foreground'>
              <span className='sr-only'>Høyeste </span>
              {formatCelsius(day.maxCelsius)}
              <span aria-hidden className='text-foreground/45'>
                {' '}
                /{' '}
              </span>
              <span className='sr-only'>laveste </span>
              <span className='text-foreground/70'>
                {formatCelsius(day.minCelsius)}
              </span>
            </p>
            <p className='mt-1 font-sans text-xs text-foreground/70'>
              {day.precipitationLabel}
            </p>
          </li>
        ))}
      </ol>
      {weather.source === 'met' ?
        <p className='mt-6 font-sans text-xs text-foreground/60'>
          <a
            href='https://www.met.no/'
            target='_blank'
            rel='noopener noreferrer'
            className='underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground'
          >
            {weather.attribution}
          </a>
          {' '}
          (
          <a
            href='https://creativecommons.org/licenses/by/4.0/deed.no'
            target='_blank'
            rel='noopener noreferrer'
            className='underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground'
          >
            CC BY 4.0
          </a>
          )
        </p>
      : null}
    </div>
  )
}

async function OsCaravanOpenState() {
  await connection()

  return (
    <p className='font-sans text-sm text-foreground'>
      {describeOsCaravanOpenState()}
    </p>
  )
}

async function OsCaravanVisitSignals() {
  const facts = await fetchOsCaravanVisitFacts()
  if (!facts.ratingLabel && !facts.driveLabel) {
    return null
  }

  return (
    <ul className='grid gap-1 font-sans text-sm text-foreground'>
      {facts.ratingLabel ?
        <li>
          {facts.reviewsHref ?
            <a
              href={facts.reviewsHref}
              target='_blank'
              rel='noopener noreferrer'
              className='underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground'
            >
              {facts.ratingLabel}
              <span className='sr-only'> (åpnes i ny fane)</span>
            </a>
          : facts.ratingLabel}
        </li>
      : null}
      {facts.driveLabel ? <li>{facts.driveLabel}</li> : null}
    </ul>
  )
}

async function OsCaravanWeatherPanel() {
  const [weather, facts] = await Promise.all([
    fetchOsCaravanWeather(),
    fetchOsCaravanVisitFacts()
  ])
  if (!weather) {
    return null
  }

  return (
    <OsCaravanWeatherStrip
      weather={weather}
      airQualityLabel={facts.airQualityLabel}
    />
  )
}

export function OsCaravanVisitSection() {
  const embedUrl = createOsCaravanMapEmbedUrl()

  return (
    <section
      id='finn-oss'
      className='relative overflow-hidden bg-night px-4 py-20 text-foreground sm:px-6 lg:px-8'
      aria-labelledby='os-caravan-visit-heading'
    >
      <div className='absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent' />
      <div className='mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-end'>
        <NbccReveal className='flex flex-col gap-6'>
          <div>
            <h2
              id='os-caravan-visit-heading'
              className='max-w-xl font-sans font-semibold text-3xl tracking-normal text-balance text-foreground sm:text-4xl'
            >
              Os Caravan & Fritid
            </h2>
            <p className='mt-5 max-w-md font-sans text-base leading-7 text-pretty text-foreground'>
              Eventyrdagene skjer her. Sjekk veien og været før
              du kjører inn på Industrivegen.
            </p>
          </div>

          <Suspense fallback={null}>
            <OsCaravanOpenState />
          </Suspense>

          <Suspense fallback={null}>
            <OsCaravanVisitSignals />
          </Suspense>

          <address className='font-sans text-base not-italic leading-7 text-foreground'>
            {OS_CARAVAN_VENUE.streetAddress}
            <br />
            {OS_CARAVAN_VENUE.postalCode}{' '}
            {OS_CARAVAN_VENUE.addressLocality}
          </address>

          <dl className='grid gap-2 font-sans text-sm text-foreground'>
            {OS_CARAVAN_VENUE.hours.map(entry => (
              <div
                key={entry.label}
                className='grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] gap-4'
              >
                <dt className='text-foreground/75'>{entry.label}</dt>
                <dd className='text-right'>{entry.value}</dd>
              </div>
            ))}
          </dl>

          <p className='font-sans text-sm text-foreground'>
            <a
              href={OS_CARAVAN_VENUE.phoneHref}
              className='underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground'
            >
              {OS_CARAVAN_VENUE.phoneDisplay}
            </a>
          </p>

          <Button
            asChild
            size='lg'
            variant='commerce-primary'
            className='h-12 w-fit min-w-0 justify-center gap-2 rounded-2xl px-6 font-sans font-semibold text-base'
          >
            <a
              href={OS_CARAVAN_VENUE.directionsHref}
              target='_blank'
              rel='noopener noreferrer'
            >
              Veibeskrivelse
              <span className='sr-only'> (åpnes i ny fane)</span>
              <MoveRightIcon size={18} animateOnHover='default' />
            </a>
          </Button>
        </NbccReveal>

        <NbccReveal className='relative aspect-4/3 min-h-[20rem] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10'>
          <iframe
            title='Kart som viser Os Caravan & Fritid i Os'
            src={embedUrl}
            width={800}
            height={600}
            loading='lazy'
            referrerPolicy='strict-origin-when-cross-origin'
            allowFullScreen
            className='absolute inset-0 h-full w-full border-0'
          />
        </NbccReveal>
      </div>

      <div className='mx-auto mt-4 max-w-7xl'>
        <Suspense fallback={<OsCaravanWeatherSkeleton />}>
          <OsCaravanWeatherPanel />
        </Suspense>
      </div>
    </section>
  )
}
