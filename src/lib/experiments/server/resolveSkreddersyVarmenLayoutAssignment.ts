import 'server-only'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { skreddersyVarmenLayoutFlag } from '@/flags'
import { hasCookiebotStatisticsConsent } from '@/lib/experiments/cookiebotStatisticsConsent'
import {
  SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
  skreddersyVarmenLayoutAssignmentSchema,
  type SkreddersyVarmenLayoutAssignment
} from '@/lib/experiments/skreddersyVarmenLayoutExperiment'

const googleAnalyticsCookieSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9._-]+$/u)

function anonymizeBucketingIdentifier(value: string) {
  return createHash('sha256')
    .update(SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY + ':' + value)
    .digest('hex')
}

export async function resolveSkreddersyVarmenLayoutAssignment(): Promise<
  SkreddersyVarmenLayoutAssignment | undefined
> {
  const cookieStore = await cookies()

  if (
    !hasCookiebotStatisticsConsent(
      cookieStore.get('CookieConsent')?.value
    )
  ) {
    return undefined
  }

  const googleAnalyticsCookie =
    googleAnalyticsCookieSchema.safeParse(
      cookieStore.get('_ga')?.value
    )
  if (!googleAnalyticsCookie.success) return undefined

  const variant = await skreddersyVarmenLayoutFlag.run({
    identify: {
      user: {
        userId: anonymizeBucketingIdentifier(
          googleAnalyticsCookie.data
        )
      }
    }
  })

  return skreddersyVarmenLayoutAssignmentSchema.parse({
    key: SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
    variant
  })
}
