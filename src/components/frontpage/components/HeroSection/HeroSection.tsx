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
        'isolate mx-auto w-screen overflow-hidden rounded-b-2xl bg-primary px-5 pt-5 pb-10 font-sans text-foreground sm:px-6 sm:py-12 lg:py-16'
      )}
    >
      <div className='relative mx-auto flex w-full max-w-none flex-col items-center justify-center overflow-hidden text-center sm:max-w-[95%] lg:max-w-none'>
        <HeroImage />
        <MotionContent />
      </div>
    </article>
  )
}
