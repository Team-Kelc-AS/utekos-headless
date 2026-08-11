import { PatternFrame } from '@/components/ui/pattern-frame'
import { HyttePricingBuyButton } from '@/app/inspirasjon/hytte/sections/HyttePricingBuyButton'

const hyttePatternGutterWidth = 'clamp(1rem, 4vw, 2.5rem)'
const hyttePatternContentWidth =
  'min(64rem, calc(100% - var(--pattern-gutter-width, 2.5rem) - var(--pattern-gutter-width, 2.5rem)))'

export function TailwindSection() {
  return (
    <PatternFrame
      as='section'
      surface='dark'
      variant='content'
      gutterWidth={hyttePatternGutterWidth}
      contentWidth={hyttePatternContentWidth}
      showHorizontalRules={false}
      className='overflow-x-clip bg-background text-foreground'
      contentClassName='w-full min-w-0 px-6 py-24 sm:py-32 lg:px-8'
    >
      <div className='mx-auto max-w-4xl text-center'>
        <h2 className='font-utekos-text-medium text-base/7 text-foreground'>
          Pris
        </h2>
        <p className='mt-2 font-utekos-text-medium text-5xl tracking-tight text-balance text-foreground sm:text-6xl'>
          Velg din favoritt
        </p>
      </div>

      <p className='mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-foreground sm:text-xl/8'>
        Velg varianten som du liker best eller egner seg til ditt
        bruksscenario for å få den beste komforten og skreddersy
        varmen etter behovene dine.
      </p>

      <div className='mx-auto mt-16 grid w-full max-w-lg min-w-0 grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2'>
        <div className='rounded-3xl rounded-t-3xl bg-dark-teal p-8 text-foreground ring-1 ring-border sm:rounded-b-none sm:p-10 lg:rounded-tr-none lg:rounded-bl-3xl dark:ring-dark-border'>
          <h3
            id='utekos-mikrofiber'
            className='font-utekos-text-medium text-base/7 text-card-foreground'
          >
            Utekos Mikrofiber™
          </h3>
          <p className='mt-4 flex items-baseline gap-x-2'>
            <span className='font-utekos-text-medium text-5xl tracking-tight text-card-foreground'>
              1590
            </span>
            <span className='text-base text-card-foreground'>
              kr
            </span>
          </p>
          <p className='mt-6 text-base/7 text-card-foreground'>
            Kolleksjonens letteste modell for deg som vil ha
            varme uten mye volum. Den pakker seg lett, tørker
            raskt og gir trygg komfort i bobilen, båten, på hytta
            eller på sidelinjen.
          </p>
          <ul
            role='list'
            className='mt-8 space-y-3 text-sm/6 text-card-foreground sm:mt-10'
          >
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-card-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Pakker seg lett
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-card-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Hurtigtørkende
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-card-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Allergivennlig
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-card-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              YKK® Dual V-Zip™
            </li>
          </ul>
          <HyttePricingBuyButton
            productHandle='utekos-mikrofiber'
            labelledById='utekos-mikrofiber'
            variant='default'
            className='mt-8 w-full sm:mt-10'
          />
        </div>
        <div className='relative rounded-3xl border-none bg-jungle p-8 text-foreground sm:p-10'>
          <h3
            id='utekos-techdown'
            className='font-utekos-text-medium text-base/7 text-foreground'
          >
            Utekos TechDown™
          </h3>
          <p className='mt-4 flex items-baseline gap-x-2'>
            <span className='font-utekos-text-medium text-5xl tracking-tight text-foreground'>
              1790
            </span>
            <span className='text-base text-foreground'>kr</span>
          </p>
          <p className='mt-6 text-base/7 text-foreground'>
            Vårt første hybridiske produkt. Kombinasjonen av
            CloudWeave™ og tekstil med Luméa™-skallet gir en
            sofistikert finish og fungerer samtidig som et
            beskyttende skjold, mens den innovative
            CloudWeave™-isolasjonen sikrer pålitelig varme under
            varierende forhold.
          </p>
          <ul
            role='list'
            className='mt-8 space-y-3 text-sm/6 text-foreground sm:mt-10'
          >
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Sofistikert finish
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Innovativ isolasjon
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Bygget for nordisk vær
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              YKK® Dual V-Zip™
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Vannavstøtende
            </li>
            <li className='flex gap-x-3'>
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                data-slot='icon'
                aria-hidden='true'
                className='h-6 w-5 flex-none text-foreground'
              >
                <path
                  d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
                  clipRule='evenodd'
                  fillRule='evenodd'
                />
              </svg>
              Helårsbruk
            </li>
          </ul>
          <HyttePricingBuyButton
            productHandle='utekos-techdown'
            labelledById='utekos-techdown'
            className='mt-8 w-full sm:mt-10'
            buttonClassName='text-dark-teal'
          />
        </div>
      </div>
    </PatternFrame>
  )
}
