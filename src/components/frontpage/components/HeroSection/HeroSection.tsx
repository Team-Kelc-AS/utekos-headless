'use cache'

import { cacheLife, cacheTag } from 'next/cache'
import { cn } from '@/lib/utils/className'
import { HeroImage } from './HeroImage'
import { MotionContent } from './MotionContent'

export async function HeroSection() {
  cacheLife('days')
  cacheTag('static-sections', 'home-hero')

  return (
    <article
      className={cn(
        'isolate mx-auto w-screen overflow-hidden rounded-b-2xl bg-night px-5 pt-5 pb-10 font-sans text-foreground sm:px-3 sm:pt-3 sm:pb-10 lg:px-3 lg:pt-3 lg:pb-12'
      )}
    >
      <div className='relative mx-auto flex w-full max-w-none flex-col items-center justify-center overflow-hidden text-center'>
        <HeroImage />
        <div className='w-full px-4 sm:px-0'>
          <h1
            id='hero-h1'
            className='mx-auto max-w-3xl pt-6 text-center text-3xl font-semibold text-balance text-foreground sm:pt-5 md:text-5xl'
          >
            Skreddersy varmen
          </h1>
          <MotionContent />
        
        </div>
      </div>
    </article>
  )
}
