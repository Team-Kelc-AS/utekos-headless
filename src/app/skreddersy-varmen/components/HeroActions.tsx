// Path: src/app/skreddersy-varmen/components/HeroActions.tsx

'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { reportLandingSelectPromotion } from '@/app/skreddersy-varmen/utils/reportLandingSelectPromotion'

const SCROLL_TARGETS = {
  purchase: 'purchase-section',
  solution: 'section-solution'
} as const

function smoothScrollTo(id: string) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  void scrollToElement(id, { offsetY: 72, reducedMotion })
}

export function HeroActions() {
  return (
    <>
      <div className='mt-9 flex w-full max-w-76 flex-col items-stretch gap-3'>
        {/* Primærknapp: Varm, konverterende kontrast (Iced Apricot) mot den mørke kveldsbakgrunnen */}
        <BrandBadge
          asChild
          bgColor='var(--primary)'
          fgColor='var(--primary-foreground)'
          className='h-12 w-full px-5 py-0 font-utekos-text-medium text-sm leading-none tracking-normal shadow-xl transition-[filter,transform] hover:brightness-105 active:scale-[0.97] md:h-14 md:text-base'
        >
          <button
            type='button'
            onClick={() => {
              reportLandingSelectPromotion('heroCta')
              smoothScrollTo(SCROLL_TARGETS.purchase)
            }}
            data-track='HeroCtaSkreddersyVarmen'
            className='group inline-flex items-center gap-2 leading-none'
          >
            <span className='block leading-none'>
              Velg størrelse
            </span>
            <ArrowRight
              className='size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1'
              aria-hidden
            />
          </button>
        </BrandBadge>

        <BrandBadge
          asChild
          bgColor='var(--secondary)'
          fgColor='var(--secondary-foreground)'
          className='h-12 w-full px-5 py-0 font-utekos-text-medium text-sm leading-none tracking-normal shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.97] md:h-14 md:text-base'
        >
          <button
            type='button'
            onClick={() => {
              reportLandingSelectPromotion('heroSecondary')
              smoothScrollTo(SCROLL_TARGETS.solution)
            }}
            data-track='HeroSecondaryCtaSkreddersyVarmen'
            className='group inline-flex items-center gap-2 leading-none'
          >
            <span className='block leading-none'>
              Se 3-i-1-løsningen
            </span>
            <ChevronDown
              className='size-4 shrink-0'
              aria-hidden
            />
          </button>
        </BrandBadge>
      </div>

      {/* Bla videre pil nederst - justert til off-white for å blende elegant inn i det mørke */}
      <button
        type='button'
        onClick={() => {
          reportLandingSelectPromotion('heroScrollCue')
          smoothScrollTo(SCROLL_TARGETS.solution)
        }}
        aria-label='Bla videre'
        className='absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-foreground/75 transition-[opacity,transform] duration-300 hover:translate-y-1 hover:text-foreground hover:opacity-100 md:flex'
      >
        <span className='font-utekos-text-medium text-[10px] tracking-normal'>
          Bla videre
        </span>
        <ChevronDown
          size={20}
          className='animate-bounce motion-reduce:animate-none'
          aria-hidden
        />
      </button>
    </>
  )
}
