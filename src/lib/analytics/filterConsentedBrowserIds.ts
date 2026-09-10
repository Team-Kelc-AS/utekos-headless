import type { ConsentSnapshot } from './canonicalEventEnvelope'

const STATISTICS_KEYS = new Set([
  'ga_client',
  'ga_client_id',
  'ga_cookie',
  'ga_session_id'
])
const MARKETING_KEYS = new Set([
  'fbp',
  'fbc',
  'gcl_au',
  'uet_msclkid',
  'uet_sid',
  'uet_vid',
  'uet_session',
  'uet_visitor',
  'sc_cookie1'
])

export function filterConsentedBrowserIds(
  ids: Record<string, string> | undefined,
  consent: ConsentSnapshot
) {
  const entries = Object.entries(ids ?? {}).filter(
    ([key]) =>
      (consent.analytics === 'granted' &&
        STATISTICS_KEYS.has(key)) ||
      (consent.marketing === 'granted' &&
        MARKETING_KEYS.has(key))
  )
  return entries.length ? Object.fromEntries(entries) : undefined
}
