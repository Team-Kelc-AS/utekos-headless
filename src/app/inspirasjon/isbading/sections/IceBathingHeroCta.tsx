'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

/**
 * Isbading-heroens primær-CTA. Isolert som klient-komponent slik at selve
 * hero-seksjonen kan forbli en Server Component.
 */
export function IceBathingHeroCta() {
  return (
    <BrandBadge
      asChild
      backgroundColor='var(--primary)'
      textColor='var(--background)'
      className='group dark:border-dark-primary/24 font-google-sans min-h-14 min-w-[200px] border border-primary/24 px-8 py-4 text-base leading-4 font-bold tracking-normal shadow-2xl transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105'
    >
      <Link
        href='#product-spotlight'
        onClick={e => {
          e.preventDefault()

          const element = document.getElementById(
            'product-spotlight'
          )
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }}
        className='inline-flex items-center justify-center'
      >
        Kle deg for kulden
        <ArrowRight
          className='ml-2 size-4 transition-transform group-hover:translate-x-1'
          aria-hidden
        />
      </Link>
    </BrandBadge>
  )
}
