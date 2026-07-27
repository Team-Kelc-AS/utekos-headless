import Image from 'next/image'
import { Star, ChevronDown } from 'lucide-react'
import CinemaOne from '@public/cinema-twilight.webp'
import MobileOne from '@public/skreddersy-varmen-hero-mobile.webp'
import { ScrollToButton } from './ScrollToButton' // Importer den lille klient-komponenten

export function HeroSection() {
  return (
    <article className='relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#2C2420]'>
      <div className='absolute inset-0 z-0 hidden md:block'>
        <Image
          src={CinemaOne}
          alt='Utekos stemning på terrassen - nyt kvelden lenger'
          fill
          priority
          placeholder='blur' // Bra for UX på tregt hyttenett
          className='animate-slow-zoom object-cover opacity-90'
          quality={95}
          sizes='(max-width: 767px) 0px, 100vw'
        />
      </div>

      <div className='absolute inset-0 z-0 block md:hidden'>
        <Image
          src={MobileOne}
          alt='Utekos stemning mobil'
          fill
          priority
          placeholder='blur'
          className='object-cover opacity-100'
          quality={95}
          sizes='(min-width: 768px) 0px, 100vw'
        />
      </div>

      <div className='absolute inset-0 bg-linear-to-b from-black/50 via-transparent via-60% to-[#1F2421] to-95%' />

      <div className='relative z-10 flex h-full w-full flex-col items-center justify-start px-6 pt-32 md:justify-center md:pt-0'>
        <h1 className='mb-4 text-center text-4xl leading-[0.95] tracking-[-0.01em] text-balance text-foreground drop-shadow-xl md:mb-6 md:text-7xl'>
          <span className='font-google-sans font-bold tracking-tight'>
            Skreddersy varmen
          </span>{' '}
          <br className='hidden md:block' />
          <span className='mt-2 block text-2xl leading-[0.95] font-light tracking-[-0.01em] text-foreground italic opacity-90 md:text-6xl'>
            Forleng de gode stundene
          </span>
        </h1>

        <p className='leading-text-paragraph mb-8 max-w-xs text-center text-lg font-light tracking-[-0.01em] text-foreground drop-shadow-md md:mb-12 md:max-w-3xl md:text-2xl'>
          Utekos® definerer en ny standard for utendørs velvære.
          Juster, form og nyt – uansett sted og temperatur.
        </p>

        <div className='flex w-full flex-col items-center gap-6'>
          <ScrollToButton />

          <div className='flex animate-in flex-col items-center delay-300 duration-1000 fade-in slide-in-from-bottom-4'>
            <div className='mb-2 flex gap-1 text-[#FFD700] drop-shadow-md'>
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} fill='currentColor' size={16} />
              ))}
            </div>
            <p className='leading-text-paragraph text-sm font-medium tracking-[-0.01em] text-[#F4F1EA]/90 shadow-black'>
              4.8/5 - fra våre livsnytere
            </p>
          </div>
        </div>
      </div>

      <div className='absolute bottom-8 z-20 hidden animate-bounce text-[#F4F1EA]/50 md:block'>
        <ChevronDown size={32} />
      </div>
    </article>
  )
}
