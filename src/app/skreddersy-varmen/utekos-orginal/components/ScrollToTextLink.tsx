'use client'

import { ArrowRight } from 'lucide-react'
import { scrollToElement } from '@/lib/motion/scrollToElement'

export function ScrollToTextLink() {
  const scrollToModel = () => {
    void scrollToElement('section-solution', { offsetY: 80 })
  }

  return (
    <button
      onClick={scrollToModel}
      className='group font-google-sans inline-flex items-center gap-4 border-b border-[#2C2420] pb-2 text-sm font-bold tracking-widest text-[#2C2420] uppercase transition-all duration-300 hover:border-[#E07A5F] hover:text-[#E07A5F]'
    >
      Utforsk kolleksjonen
      <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-2' />
    </button>
  )
}
