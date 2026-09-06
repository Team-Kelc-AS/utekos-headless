import { CheckIcon } from '@heroicons/react/24/outline'

export function TrustSection() {
  return (
    <article className='py-24'>
      <div className='container mx-auto px-4'>
        <div className='mx-auto max-w-4xl'>
          <div className='mb-12 text-center'>
            <h2 className='font-google-sans text-3xl font-bold sm:text-4xl'>
              En garantert suksess
            </h2>
            <p className='mt-4 text-lg text-muted-foreground'>
              Vi gjør gaveshoppingen trygg og enkel for deg.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-8 text-center md:grid-cols-3'>
            <div className='flex flex-col items-center'>
              <CheckIcon className='mb-4 h-8 w-8 text-cyan-400' />
              <h3 className='mb-2 font-utekos-text-medium'>
                14 dagers åpent kjøp
              </h3>
              <p className='text-sm text-muted-foreground'>
                Bytt farge eller størrelse uten stress. Vi
                hjelper deg gjerne.
              </p>
            </div>
            <div className='flex flex-col items-center'>
              <CheckIcon className='mb-4 h-8 w-8 text-emerald-400' />
              <h3 className='mb-2 font-utekos-text-medium'>
                Rask levering
              </h3>
              <p className='text-sm text-muted-foreground'>
                Vi sender raskt fra vårt lager i Norge, slik at
                gaven kommer frem i tide.
              </p>
            </div>
            <div className='flex flex-col items-center'>
              <CheckIcon className='mb-4 h-8 w-8 text-amber-400' />
              <h3 className='mb-2 font-utekos-text-medium'>
                Trygg handel
              </h3>
              <p className='text-sm text-muted-foreground'>
                Vil tilbyr betaling med Klarna og Vipps
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
