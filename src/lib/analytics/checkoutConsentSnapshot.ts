import { updateCartAttributesAction } from '@/lib/actions/updateCartAttributesAction'
import type { ConsentSnapshot } from './canonicalEventEnvelope'

const CHECKOUT_CONSENT_SESSION_PREFIX =
  'utekos:checkout_consent:'
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

function sessionStorageKey(cartId: string) {
  return `${CHECKOUT_CONSENT_SESSION_PREFIX}${cartId}`
}

function parseConsentValue(
  value: unknown
): ConsentValue | undefined {
  return value === 'granted' || value === 'denied' ?
      value
    : undefined
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

export function readCheckoutConsentSnapshot(
  cartId: string
): ConsentSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(
      sessionStorageKey(cartId)
    )
    if (!raw) return null

    return parseConsentPayload(JSON.parse(raw)) ?? null
  } catch {
    return null
  }
}

export function persistCheckoutConsentSnapshot(
  cartId: string,
  consent: ConsentSnapshot
): void {
  if (typeof window === 'undefined') return

  const serializedConsent = JSON.stringify(consent)

  try {
    window.sessionStorage.setItem(
      sessionStorageKey(cartId),
      serializedConsent
    )
  } catch {
    return
  }

  void persistCheckoutConsentCartAttribute(
    cartId,
    serializedConsent
  )
}

async function persistCheckoutConsentCartAttribute(
  cartId: string,
  serializedConsent: string
) {
  try {
    await updateCartAttributesAction(cartId, [
      {
        key: CART_CONSENT_ATTRIBUTE_KEY,
        value: serializedConsent
      }
    ])
  } catch {
    return
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
