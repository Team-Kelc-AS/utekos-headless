import Image from 'next/image'
import { Star, ChevronDown, Check } from 'lucide-react'
import CinemaOne from '@/assets/images/campaign/cinema-twilight.webp'
import MobileOne from '@/assets/images/campaign/skreddersy-varmen-hero-mobile.webp'
import { ScrollToButton } from './ScrollToButton'
import { KlarnaCreditPromotionAutoSize } from '@/components/klarna/components/KlarnaCreditPromotionAutoSize'
import { KlarnaOnSiteMessagingScript } from '@/components/klarna/components/KlarnaOnSiteMessagingScript'
import { getKlarnaMinorUnitAmount } from '@/components/klarna/utils/getKlarnaMinorUnitAmount'
import { productConfig } from '@/app/skreddersy-varmen/utekos-orginal/utils/productConfig'

const klarnaPurchaseAmount = getKlarnaMinorUnitAmount({
  amount: String(productConfig.price),
  currencyCode: 'NOK'
})

export function HeroSection() {
  return (
    <article className='relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#2C2420]'>
      <div className='absolute inset-0 z-0 hidden md:block'>
        <Image
          src={CinemaOne}
          alt='Utekos stemning på terrassen - nyt kvelden lenger'
          fill
          priority
          placeholder='blur'
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
          <span className='font-sans text-5xl font-extrabold tracking-tight md:text-[7rem] lg:text-[8rem]'>
            Skreddersy varmen
          </span>{' '}
          <br className='hidden md:block' />
          <span className='mt-2 block font-utekos-text-medium text-2xl leading-[0.95] tracking-[-0.01em] text-foreground italic opacity-90 md:my-6 md:text-[3.5rem] lg:text-[4rem]'>
            Forleng de gode stundene
          </span>
        </h1>

        <p className='leading-text-paragraph mb-8 max-w-xs text-center text-lg font-light tracking-[-0.01em] text-foreground drop-shadow-md md:mb-12 md:max-w-3xl md:text-2xl'>
          Utekos® definerer en ny standard for utendørs velvære.
          <span className='block'>Juster, form og nyt.</span>
        </p>

        <div className='flex w-full flex-col items-center gap-6'>
          <ScrollToButton />

          <div className='flex animate-in flex-col items-center delay-300 duration-1000 fade-in slide-in-from-bottom-4'>
            <div className='mb-2 flex gap-1 text-[#FFD700] drop-shadow-md'>
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} fill='currentColor' size={16} />
              ))}
            </div>
            <p className='leading-text-paragraph mb-2 text-center text-sm font-medium tracking-[-0.01em] text-[#F4F1EA]/90 shadow-black'>
              4.8/5 - fra våre livsnytere
            </p>
            <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium tracking-[-0.01em] text-[#F4F1EA]/90'>
              <span className='flex items-center gap-1.5'>
                <Check
                  size={14}
                  className='shrink-0 text-primary'
                  aria-hidden
                />
                Gratis frakt
              </span>
              <span className='flex items-center gap-1.5'>
                <Check
                  size={14}
                  className='shrink-0 text-primary'
                  aria-hidden
                />
                Rask levering
              </span>
            </div>
            {klarnaPurchaseAmount ?
              <div
                role='group'
                aria-label='Betalingsinformasjon fra Klarna'
                className='mt-3 max-w-md overflow-hidden'
              >
                <KlarnaCreditPromotionAutoSize
                  id='klarna-credit-promotion-utekos-orginal-hero'
                  purchaseAmount={klarnaPurchaseAmount}
                  theme='dark'
                />
              </div>
            : null}
          </div>
        </div>
      </div>

      <div className='absolute bottom-8 z-20 hidden animate-bounce text-[#F4F1EA]/50 md:block'>
        <ChevronDown size={32} />
      </div>

      <KlarnaOnSiteMessagingScript />
    </article>
  )
}
