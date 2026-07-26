import { ArrowRight, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export function FunctionalityPageVideoSection() {
  return (
    <section className='dark:border-dark-foreground/20 border-t border-foreground/20'>
      <div className='container mx-auto px-4 py-12 sm:py-16'>
        <div className='dark:border-dark-foreground/12 dark:ring-dark-foreground/12 overflow-hidden rounded-3xl border border-foreground/12 bg-card text-foreground shadow-2xl ring-1 ring-foreground/12'>
          <div className='grid lg:grid-cols-2'>
            <div className='flex flex-col justify-center p-8 lg:p-16'>
              <div className='dark:border-dark-foreground/20 dark:bg-dark-foreground/10 mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-foreground/20 bg-foreground/10 px-4 py-1.5 text-sm backdrop-blur-md'>
                <PlayCircle className='size-4' aria-hidden />
                <span>Se demonstrasjon</span>
              </div>
              <h2 className='font-google-sans text-3xl font-bold sm:text-4xl'>
                Slik fungerer det i praksis
              </h2>
              <p className='/80 mt-4 text-foreground/80'>
                Det er enklere enn du tror. Se videoen for å lære
                hvordan du på sekunder tilpasser din Utekos til
                situasjonen du befinner deg i. Fra full
                avslapning til full mobilitet.
              </p>

              <Link
                href='/produkter/utekos-techdown'
                className='mt-8 inline-flex items-center font-utekos-text-medium text-lg text-foreground hover:text-sky-300 hover:underline'
              >
                Utforsk kolleksjonen
                <ArrowRight
                  className='ml-2 size-5'
                  aria-hidden
                />
              </Link>
            </div>

            <div className='bg-card-secondary relative aspect-video w-full lg:aspect-auto lg:h-full'>
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='/50 text-center text-foreground/50'>
                  <PlayCircle
                    className='mx-auto size-16 opacity-50'
                    aria-hidden
                  />
                  <p className='mt-2 text-sm'>
                    Video kommer her
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
