import { z } from 'zod'
import {
  consentSnapshotSchema,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
const CART_CONSENT_ATTRIBUTE_KEY = 'utekos_consent'
const DEFAULT_CONSENT_VERSION = '1'

export const unresolvedOrderConsentSnapshotSchema =
  z.strictObject({
    analytics: z.literal('unknown'),
    marketing: z.literal('unknown'),
    preferences: z.literal('unknown'),
    source: z.literal('shopify_order_attribute'),
    version: z.string().min(1),
    resolution: z.enum([
      'missing',
      'empty',
      'invalid_json',
      'invalid_payload'
    ])
  })

export const orderConsentSnapshotSchema = z.union([
  consentSnapshotSchema,
  unresolvedOrderConsentSnapshotSchema
])

export type OrderConsentSnapshot = z.infer<
  typeof orderConsentSnapshotSchema
>

type ConsentValue = ConsentSnapshot['analytics']
type UnresolvedConsentResolution = z.infer<
  typeof unresolvedOrderConsentSnapshotSchema
>['resolution']

type ParsedConsentPayload = {
  analytics?: unknown
  marketing?: unknown
  preferences?: unknown
  version?: unknown
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

function unresolvedConsentSnapshot(
  resolution: UnresolvedConsentResolution
): OrderConsentSnapshot {
  return {
    analytics: 'unknown',
    marketing: 'unknown',
    preferences: 'unknown',
    source: 'shopify_order_attribute',
    version: DEFAULT_CONSENT_VERSION,
    resolution
  }
}

export function parseOrderConsentFromNoteAttributes(
  noteAttributes: ReadonlyArray<{ name: string; value: string }>
): OrderConsentSnapshot {
  const consentAttribute = noteAttributes.find(
    attribute => attribute.name === CART_CONSENT_ATTRIBUTE_KEY
  )

  if (!consentAttribute) {
    return unresolvedConsentSnapshot('missing')
  }

  if (!consentAttribute.value.trim()) {
    return unresolvedConsentSnapshot('empty')
  }

  try {
    return (
      parseConsentPayload(JSON.parse(consentAttribute.value)) ??
      unresolvedConsentSnapshot('invalid_payload')
    )
  } catch {
    return unresolvedConsentSnapshot('invalid_json')
  }
}
