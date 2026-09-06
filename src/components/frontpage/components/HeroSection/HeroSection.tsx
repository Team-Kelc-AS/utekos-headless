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
        'isolate mx-auto w-screen overflow-hidden rounded-b-2xl bg-primary px-4 pt-4 pb-6 font-sans text-foreground sm:px-4 sm:pt-12 sm:pb-10 lg:pt-16'
      )}
    >
      <div className='align-center relative mx-auto mb-7 flex w-full max-w-none flex-col items-center justify-center overflow-hidden text-center sm:mb-10 sm:max-w-[95%] lg:max-w-none'>
        <HeroImage />
        <MotionContent />
      </div>
    </article>
  )
}
