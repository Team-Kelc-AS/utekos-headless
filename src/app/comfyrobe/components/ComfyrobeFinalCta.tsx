'use client'

import * as m from 'motion/react-m'
import { ArrowUp } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { scrollToElement } from '@/lib/motion/scrollToElement'
import { reportComfyrobePurchaseSelection } from '../lib/reportComfyrobePurchaseSelection'
import type { ComfyrobeOfferSummary } from '../lib/buildComfyrobeOfferSummary'
import {
  comfyrobeRevealGroup,
  comfyrobeRevealItem,
  comfyrobeViewport
} from './comfyrobeMotionVariants'

export function ComfyrobeFinalCta({
  offer
}: {
  offer: ComfyrobeOfferSummary | null
}) {
  const label =
    offer?.availableForSale ?
      `Velg størrelse`
    : 'Se størrelse og tilgjengelighet'

  const handleClick = () => {
    reportComfyrobePurchaseSelection(
      'Velg størrelse',
      'final_cta'
    )
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    void scrollToElement('purchase-section', {
      offsetY: 76,
      reducedMotion
    })
  }

  return (
    <section
      aria-labelledby='final-cta-heading'
      className='bg-[#071f1e] px-6 py-20 text-center text-white md:px-12 md:py-28'
    >
      <m.div
        className='mx-auto max-w-4xl rounded-xl border-none bg-jungle py-12'
        initial='hidden'
        whileInView='visible'
        viewport={comfyrobeViewport}
        variants={comfyrobeRevealGroup}
      >
        <m.p
          className='font-utekos-text-medium text-sm tracking-wide text-primary'
          variants={comfyrobeRevealItem}
        >
          Klar når været ikke er det
        </m.p>
        <m.h2
          id='final-cta-heading'
          className='font-google-sans mx-auto mt-3 max-w-[12ch] font-sans text-4xl leading-[0.94] font-bold tracking-[-0.025em] md:text-6xl'
          variants={comfyrobeRevealItem}
        >
          Klar for neste ruskeværsdag?
        </m.h2>
        <m.div className='mt-8' variants={comfyrobeRevealItem}>
          <BrandBadge
            asChild
            className='min-h-13 bg-primary px-7 py-3 font-utekos-text-medium text-foreground transition-[filter,transform] hover:brightness-105 active:scale-[0.985]'
          >
            <button
              type='button'
              data-track='ComfyrobeFinalCta'
              onClick={handleClick}
            >
              {label}
              <ArrowUp className='size-4' aria-hidden />
            </button>
          </BrandBadge>
        </m.div>
      </m.div>
    </section>
  )
}
