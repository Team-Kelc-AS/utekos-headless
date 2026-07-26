import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { COMFYROBE_LANDING_FAQ } from '../data/comfyrobeLandingSeo'

export function ComfyrobeFaqSection() {
  return (
    <section
      className='bg-background py-20 text-foreground md:py-28'
      aria-labelledby='faq-heading'
    >
      <div className='mx-auto max-w-4xl px-6 md:px-12'>
        <p className='text-center font-utekos-text-medium text-sm tracking-wide text-primary dark:text-[oklch(0.78_0.15_67)]'>
          Spørsmål før kjøp
        </p>
        <h2
          id='faq-heading'
          className='font-google-sans mt-3 text-center font-sans text-4xl leading-[0.94] font-bold tracking-[-0.025em] md:text-6xl'
        >
          Trygg på valget.
        </h2>
        <p className='mx-auto mt-5 max-w-2xl text-center font-utekos-text text-lg leading-relaxed text-foreground/72'>
          Passform, værbeskyttelse og bruk – det viktigste før du
          velger størrelse.
        </p>

        <div className='mt-12 divide-y divide-border border-y border-border'>
          {COMFYROBE_LANDING_FAQ.map(item => (
            <details key={item.question} className='group py-2'>
              <summary className='cursor-pointer list-none rounded-lg py-5 font-sans font-utekos-text-medium text-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'>
                <span className='flex items-center justify-between gap-4'>
                  {item.question}
                  <ChevronDown
                    className='size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none'
                    aria-hidden
                  />
                </span>
              </summary>
              <p className='max-w-3xl pb-6 font-utekos-text leading-relaxed text-foreground/78'>
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        <nav
          aria-label='Mer kjøpshjelp'
          className='mt-9 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm'
        >
          <Link
            href='/handlehjelp/storrelsesguide#comfyrobe-size-guide'
            className='min-h-11 content-center font-utekos-text-medium underline underline-offset-4'
          >
            Se størrelsesguide
          </Link>
          <Link
            href='/handlehjelp/vask-og-vedlikehold'
            className='min-h-11 content-center font-utekos-text-medium underline underline-offset-4'
          >
            Vask og vedlikehold
          </Link>
          <Link
            href='/produkter/comfyrobe'
            className='min-h-11 content-center font-utekos-text-medium underline underline-offset-4'
          >
            Ordinær produktside
          </Link>
        </nav>
      </div>
    </section>
  )
}
