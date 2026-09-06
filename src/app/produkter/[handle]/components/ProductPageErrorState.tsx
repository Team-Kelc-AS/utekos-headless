'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

type ProductPageErrorStateProps = {
  error: Error
  isRetrying: boolean
  onRetry: () => void
}

export function ProductPageErrorState({
  error,
  isRetrying,
  onRetry
}: ProductPageErrorStateProps) {
  return (
    <article className='bg-overcast text-havdyp relative isolate overflow-hidden px-4 py-24 sm:py-32'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute top-16 left-[10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ancient-water)_58%,transparent)_0%,transparent_72%)] blur-3xl' />
        <div className='absolute right-[8%] bottom-12 h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--very-peri)_22%,transparent)_0%,transparent_72%)] blur-3xl' />
      </div>

      <article
        aria-labelledby='product-error-heading'
        className='shadow-havdyp/10 mx-auto max-w-2xl rounded-[1.75rem] border border-foreground/70 bg-foreground/72 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10'
      >
        <div className='border-havdyp/14 bg-havdyp mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border text-foreground'>
          <AlertTriangle
            className='h-6 w-6'
            aria-hidden='true'
          />
        </div>
        <h1
          id='product-error-heading'
          className='text-havdyp mb-4 font-serif text-3xl sm:text-4xl'
        >
          Vi fikk ikke hentet produktet
        </h1>
        <p className='text-havdyp/74 mx-auto max-w-xl text-base leading-relaxed sm:text-lg'>
          {error.message ||
            'Prøv igjen om litt, eller gå tilbake til produktene.'}
        </p>
        <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button
            type='button'
            onClick={onRetry}
            disabled={isRetrying}
            className='bg-flame-orange hover:bg-flame-orange/88 h-12 rounded-full px-7 text-background'
          >
            {isRetrying ? 'Prøver igjen...' : 'Prøv igjen'}
          </Button>
          <Button
            asChild
            variant='outline'
            className='border-havdyp/20 text-havdyp hover:bg-ancient-water h-12 rounded-full bg-foreground px-7'
          >
            <Link href='/produkter'>Se alle produkter</Link>
          </Button>
        </div>
      </article>
    </article>
  )
}
