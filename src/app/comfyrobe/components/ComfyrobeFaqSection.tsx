import { ChevronDown } from 'lucide-react'
import { COMFYROBE_LANDING_FAQ } from '../data/comfyrobeLandingSeo'

export function ComfyrobeFaqSection() {
  return (
    <section
      id='faq'
      className='bg-jungle px-6 py-16 text-foreground md:px-12 md:py-24 lg:px-16 lg:py-32'
      aria-labelledby='faq-heading'
    >
      <div className='mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(16rem,0.38fr)_minmax(0,1fr)] lg:items-start lg:gap-16 xl:gap-24'>
        <header className='max-w-md lg:pt-2'>
          <p className='font-utekos-text-medium text-sm tracking-[0.18em] text-primary uppercase'>
            FAQ
          </p>
          <h2
            id='faq-heading'
            className='font-google-sans mt-3 scroll-mt-24 text-balance font-sans text-4xl leading-[0.94] font-bold tracking-tight md:text-6xl'
          >
            Ofte stilte spørsmål
          </h2>
          <p className='mt-5 font-utekos-text text-base leading-relaxed text-pretty text-foreground/80 md:text-lg'>
            Kort om passform, værbeskyttelse, varme og retur før
            du velger størrelse.
          </p>
        </header>

        <div className='divide-y divide-white/12 border-y border-white/12'>
          {COMFYROBE_LANDING_FAQ.map(item => (
            <details key={item.question} className='group'>
              <summary className='flex min-h-11 cursor-pointer list-none items-center rounded-lg py-5 font-sans text-lg text-pretty touch-manipulation [-webkit-tap-highlight-color:transparent] marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden'>
                <span className='flex w-full items-center justify-between gap-4'>
                  {item.question}
                  <ChevronDown
                    className='size-5 shrink-0 text-primary transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-180 motion-reduce:transition-none'
                    aria-hidden
                  />
                </span>
              </summary>
              <p className='max-w-2xl pb-6 font-utekos-text leading-relaxed text-pretty text-foreground/78'>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
