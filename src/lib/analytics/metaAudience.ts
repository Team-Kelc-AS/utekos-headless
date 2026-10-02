import * as z from '@/lib/validation/zodMini'

// A Meta ad-click segment, never a verified customer classification.
export const metaAudienceSchema = z.enum([
  'new_audience',
  'engaged_audience',
  'existing_customers'
])
export type MetaAudience = z.infer<typeof metaAudienceSchema>

export function consentedMetaAudience(event: {
  consent: {
    analytics: 'granted' | 'granted' | 'unknown'
    marketing: 'granted' | 'granted' | 'unknown'
  }
  meta_audience?: unknown
}): MetaAudience | undefined {
  if (
    event.consent.analytics !== 'granted' ||
    event.consent.marketing !== 'granted'
  )
    return undefined
  const parsed = metaAudienceSchema.safeParse(
    event.meta_audience
  )
  return parsed.success ? parsed.data : undefined
}
