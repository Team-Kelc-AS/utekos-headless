import { ArrowDown } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

export function TechHero() {
  return (
    <article className='relative mb-24 flex min-h-[90vh] flex-col items-center justify-center overflow-hidden border-b border-border bg-background text-center text-foreground'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute top-0 left-1/2 size-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/20 blur-[120px]' />
        <div className='absolute right-0 bottom-0 size-100 translate-y-1/3 rounded-full bg-accent/20 blur-[100px]' />
      </div>

      <div className='relative z-10 container mx-auto px-4'>
        <div className='mx-auto flex max-w-4xl flex-col items-center space-y-8'>
          <BrandBadge
            backgroundColor='var(--card)'
            textColor='var(--card-foreground)'
            className='border border-border/40 px-8! py-3! text-base!'
          >
            Skapt for komfort
          </BrandBadge>

          <h1 className='font-google-sans text-5xl font-bold text-foreground sm:text-7xl md:text-8xl'>
            Ett plagg. <br />
            <span className='text-foreground'>
              Tre opplevelser.
            </span>
          </h1>

          <p className='mx-auto max-w-2xl text-lg leading-relaxed text-foreground/90 md:text-xl'>
            Det unike med Utekos er friheten til å velge. Fra en
            isolerende kokong til en elegant parkas på sekunder.
            Vi kaller det{' '}
            <strong className='text-foreground'>
              adaptiv funksjonalitet
            </strong>
            .
          </p>
        </div>
      </div>
      <div className='absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-foreground/90'>
        <ArrowDown className='h-6 w-6' aria-hidden />
      </div>
    </article>
  )
}
