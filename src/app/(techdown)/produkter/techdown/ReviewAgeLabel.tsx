'use client'

import { useEffect, useState } from 'react'
import type { ProductReviewDate } from '@/db/data/reviews/productReviews'
import {
  formatReviewAge,
  millisecondsUntilNextOsloMidnight
} from './relativeReviewDate'

type RelativeReviewDateProps = {
  date: ProductReviewDate
  initialNowIso: string
}

export function ReviewAgeLabel({
  date,
  initialNowIso
}: RelativeReviewDateProps) {
  const [now, setNow] = useState(() => new Date(initialNowIso))

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const scheduleMidnightUpdate = () => {
      const current = new Date()
      setNow(current)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(
        scheduleMidnightUpdate,
        millisecondsUntilNextOsloMidnight(current)
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleMidnightUpdate()
      }
    }

    scheduleMidnightUpdate()
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [])

  const label = formatReviewAge(date, now)

  if (date.type === 'exactDate') {
    return <time dateTime={date.datePublished}>{label}</time>
  }

  return <span>{label}</span>
}
