'use client'

import dynamic from 'next/dynamic'
import { LoadWhenVisible } from '@/components/utils/LoadWhenVisible'

const TechDownFeatureSection = dynamic(
  () =>
    import('./TechDownFeatureSection/TechDownFeatureSection').then(
      module => module.TechDownFeatureSection
    ),
  {
    ssr: false,
    loading: () => (
      <article
        className='dark:bg-dark-background/40 min-h-190 rounded-[1.75rem] bg-background/40 py-16 sm:min-h-210 sm:py-24'
        aria-hidden='true'
      />
    )
  }
)

const fallback = (
  <article
    className='dark:bg-dark-background/40 min-h-190 rounded-[1.75rem] bg-background/40 py-16 sm:min-h-210 sm:py-24'
    aria-hidden='true'
  />
)

export function LazyTechDownFeatureSection() {
  return (
    <LoadWhenVisible fallback={fallback}>
      <TechDownFeatureSection />
    </LoadWhenVisible>
  )
}
