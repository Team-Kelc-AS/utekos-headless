import type { TrackingEnvironment } from '@/lib/analytics/pageViewEvent'

export function getTrackingEnvironment(): TrackingEnvironment {
    if (process.env.NODE_ENV === 'test') {
      return 'test'
    }
  
    if (
      process.env.VERCEL_ENV === 'production'
    ) {
      return 'production'
    }
  
    if (
      process.env.VERCEL_ENV === 'preview'
    ) {
      return 'preview'
    }
  
    return 'development'
  }
  