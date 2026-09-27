import { cacheLife, cacheTag } from 'next/cache'
import { fetchJudgeMeFeaturedCarousel } from '@/lib/judgeme/fetchJudgeMeFeaturedCarousel'
import { JudgeMeReviewsCarouselView } from './JudgeMeReviewsCarouselView'

/**
 * Server-only Judge.me featured reviews carousel.
 * Cached for days so Admin metafield reads stay off the critical path.
 */
export async function JudgeMeReviewsCarousel() {
  'use cache'
  cacheLife('days')
  cacheTag('static-sections', 'judgeme-carousel')

  try {
    const data = await fetchJudgeMeFeaturedCarousel()
    if (!data) return null
    return <JudgeMeReviewsCarouselView data={data} />
  } catch (error) {
    console.error('[JudgeMeReviewsCarousel]', error)
    return null
  }
}
