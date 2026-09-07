import { z } from 'zod'
import type { ConsentSnapshot } from './canonicalEventEnvelope'

const consentValueSchema = z.enum(['denied', 'granted'])

export const leadFormTrackingContextSchema = z.strictObject({
  consent: z.strictObject({
    analytics: consentValueSchema,
    marketing: consentValueSchema,
    preferences: consentValueSchema,
    source: z.literal('cookiebot'),
    version: z.string().min(1)
  }),
  page_url: z.string().url(),
  page_view_id: z.string().uuid().optional(),
  journey_id: z.uuid().optional(),
  referrer_url: z.string().url().optional(),
  cookie_header: z.string().max(4096).optional(),
  campaign: z.string().max(200).optional(),
  medium: z.string().max(200).optional(),
  content: z.string().max(200).optional(),
  term: z.string().max(200).optional()
})

export type LeadFormTrackingContext = z.infer<
  typeof leadFormTrackingContextSchema
>

export const LEAD_TRACKING_CONTEXT_FIELD = 'leadTrackingContext'

export function parseLeadFormTrackingContext(
  raw: FormDataEntryValue | null
): LeadFormTrackingContext | undefined {
  if (typeof raw !== 'string' || raw.length === 0) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }

  const result = leadFormTrackingContextSchema.safeParse(parsed)
  if (!result.success) return undefined
  if (result.data.consent.analytics !== 'granted') {
    delete result.data.journey_id
    delete result.data.page_view_id
  }
  return result.data
}

export function deniedCookiebotConsent(): ConsentSnapshot {
  return {
    analytics: 'denied',
    marketing: 'denied',
    preferences: 'denied',
    source: 'cookiebot',
    version: '1'
  }
}
