'use cache'

import { cacheLife, cacheTag } from 'next/cache'
import { cn } from '@/lib/utils/className'
import { HeroImage } from './HeroImage'
import { MotionContent } from './MotionContent'
import { HERO_H1 } from './heroCopy'

export async function HeroSection() {
  cacheLife('days')
  cacheTag('static-sections', 'home-hero')

  return (
    <article
      className={cn(
        'isolate mx-auto w-screen overflow-hidden rounded-b-2xl bg-night px-5 pt-5 pb-0 font-sans text-foreground sm:px-3 sm:pt-3 lg:px-3 lg:pt-3'
      )}
    >
      <div className='relative mx-auto flex w-full max-w-none flex-col items-center justify-center overflow-hidden text-center'>
        <HeroImage />
        <div className='flex w-full flex-col items-center justify-center px-4 py-12 sm:px-0 sm:py-14 lg:py-16'>
          <h1
            id='hero-h1'
            className='mx-auto max-w-3xl text-center text-4xl font-semibold text-balance text-foreground sm:mb-8 sm:text-5xl lg:text-6xl'
          >
            {HERO_H1}
          </h1>
          <MotionContent />
        </div>
      </div>
    </article>
  )
}
