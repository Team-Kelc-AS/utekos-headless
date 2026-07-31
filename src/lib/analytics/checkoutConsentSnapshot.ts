import type { ConsentSnapshot } from './canonicalEventEnvelope'
const CART_CONSENT_ATTRIBUTE_KEY = 'utekos_consent'
const DEFAULT_CONSENT_VERSION = '1'

const deniedConsentSnapshot = {
  analytics: 'denied',
  marketing: 'denied',
  preferences: 'denied',
  source: 'cookiebot',
  version: DEFAULT_CONSENT_VERSION
} as const satisfies ConsentSnapshot

type ConsentValue = ConsentSnapshot['analytics']

type ParsedConsentPayload = {
  analytics?: unknown
  marketing?: unknown
  preferences?: unknown
  version?: unknown
}

function parseConsentValue(value: unknown): ConsentValue | undefined {
  return value === 'granted' || value === 'denied' ? value : undefined
}

function parseConsentPayload(
  raw: unknown
): ConsentSnapshot | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined

  const payload = raw as ParsedConsentPayload
  const analytics = parseConsentValue(payload.analytics)
  const marketing = parseConsentValue(payload.marketing)
  const preferences = parseConsentValue(payload.preferences)

  if (!analytics || !marketing || !preferences) return undefined

  const version =
    (
      typeof payload.version === 'string' &&
      payload.version.length > 0
    ) ?
      payload.version
    : DEFAULT_CONSENT_VERSION

  return {
    analytics,
    marketing,
    preferences,
    source: 'cookiebot',
    version
  }
}

export function parseOrderConsentFromNoteAttributes(
  noteAttributes: ReadonlyArray<{ name: string; value: string }>
): ConsentSnapshot {
  const consentAttribute = noteAttributes.find(
    attribute => attribute.name === CART_CONSENT_ATTRIBUTE_KEY
  )

  if (!consentAttribute?.value)
    return { ...deniedConsentSnapshot }

  try {
    return (
      parseConsentPayload(
        JSON.parse(consentAttribute.value)
      ) ?? { ...deniedConsentSnapshot }
    )
  } catch {
    return { ...deniedConsentSnapshot }
  }
}
