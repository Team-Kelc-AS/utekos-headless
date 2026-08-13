import { ChevronDown } from 'lucide-react'
import { COMFYROBE_LANDING_FAQ } from '../data/comfyrobeLandingSeo'

export function ComfyrobeFaqSection() {
  return (
    <section
      className='bg-background px-6 py-10 text-foreground md:px-12 md:py-28 lg:px-16'
      aria-labelledby='faq-heading'
    >
      <div className='mx-auto max-w-4xl rounded-xl bg-jungle px-6 py-12 md:px-12'>
        <p className='text-center font-utekos-text-medium text-sm tracking-wide text-primary'>
          Ofte stilte spørsmål
        </p>
        <h2
          id='faq-heading'
          className='font-google-sans mt-3 text-center font-sans text-4xl leading-[0.94] font-bold tracking-[-0.025em] md:text-6xl'
        >
          Trygg på valget.
        </h2>
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
      </div>
    </section>
  )
}
