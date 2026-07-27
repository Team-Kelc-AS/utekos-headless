'use client'

import { ChevronDown } from 'lucide-react'
import { scrollToElement } from '@/lib/motion/scrollToElement'

export function ScrollToButton() {
  const scrollToModel = () => {
    void scrollToElement('section-solution', { offsetY: 80 })
  }

  return (
    <button
      onClick={scrollToModel}
      data-track='HeroSectionScrollToModelClick'
      className='group relative flex w-auto items-center gap-3 rounded-full bg-commerce-primary dark:bg-dark-commerce-primary px-8 py-4 text-lg font-utekos-text-medium tracking-wide text-commerce-primary-foreground dark:text-dark-commerce-primary-foreground shadow-2xl transition-all hover:bg-commerce-primary-hover dark:hover:bg-dark-commerce-primary-hover hover:text-commerce-primary-hover-foreground dark:hover:text-dark-commerce-primary-hover-foreground active:scale-95'
    >
      Finn din favoritt
      <ChevronDown className='h-5 w-5 transition-transform group-hover:translate-y-1' />
    </button>
  )
}
