'use cache'

import { cacheLife, cacheTag } from 'next/cache'
import { cn } from '@/lib/utils/className'
import { MotionContent } from './MotionContent'

export async function HeroSection() {
  cacheLife('days')
  cacheTag('static-sections', 'home-hero')

  return (
    <article
      className={cn(
        'isolate mx-auto w-screen overflow-hidden px-0 pt-0 pb-6 sm:px-4 sm:pt-12 sm:pb-10 lg:pt-16 dark:bg-background'
      )}
    >
      <div>
        <MotionContent />
      </div>
    </article>
  )
}
