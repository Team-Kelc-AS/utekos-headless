import 'server-only'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { hasCookiebotStatisticsConsent } from '@/lib/experiments/cookiebotStatisticsConsent'
import { createSkreddersyVarmenFlagEntities } from '@/lib/experiments/server/createSkreddersyVarmenFlagEntities'
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

export async function resolveSkreddersyVarmenLayoutAssignment(
  request: NextRequest
): Promise<SkreddersyVarmenLayoutAssignment | undefined> {
  const cookieStore = request.cookies

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

  const { skreddersyVarmenLayoutFlag } = await import('@/flags')
  const variant = await skreddersyVarmenLayoutFlag.run({
    request,
    identify: createSkreddersyVarmenFlagEntities(
      googleAnalyticsCookie.data
    )
  })

  return skreddersyVarmenLayoutAssignmentSchema.parse({
    key: SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
    variant
  })
}
