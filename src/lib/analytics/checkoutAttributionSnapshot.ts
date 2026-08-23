import { z } from 'zod'
import {
  canonicalEventEnvelopeSchema,
  type ConsentSnapshot
} from './canonicalEventEnvelope'
import type { CanonicalClickIds } from './canonicalSignalContract'
import {
  CAMPAIGN_ATTRIBUTION_KEYS,
  campaignAttributionSchema,
  parseCampaignAttribution,
  type CampaignAttribution
} from './campaignAttribution'
import { parseOrderConsentFromNoteAttributes } from './checkoutConsentSnapshot'

const CONSENT_ATTRIBUTE = 'utekos_consent'
const CAPTURED_AT_ATTRIBUTE = 'utekos_attribution_captured_at'
const EXTERNAL_ID_ATTRIBUTE = 'utekos_external_id'
const PAGE_URL_ATTRIBUTE = 'utekos_page_url'
const REFERRER_URL_ATTRIBUTE = 'utekos_referrer_url'
export const BEGIN_CHECKOUT_EVENT_ATTRIBUTE =
  'utekos_begin_checkout_event_id'

const browserAttributeKeys = {
  fbc: '_fbc',
  fbp: '_fbp',
  ga_client: '_ga',
  ga_client_id: 'ga_client_id',
  ga_cookie: 'ga_cookie',
  ga_session_id: 'ga_session_id',
  sc_cookie1: '_scid',
  uet_session: '_uetsid',
  uet_visitor: '_uetvid'
} as const

const clickAttributeKeys = {
  dclid: 'dclid',
  epik: 'epik',
  fbclid: 'fbclid',
  gbraid: 'gbraid',
  gclid: 'gclid',
  msclkid: 'msclkid',
  sc_click_id: 'sc_click_id',
  ttclid: 'ttclid',
  twclid: 'twclid',
  wbraid: 'wbraid'
} as const

const campaignAttributeKeys = {
  campaign_id: 'utekos_campaign_id',
  campaign_name: 'utekos_campaign_name',
  adset_id: 'utekos_adset_id',
  adset_name: 'utekos_adset_name',
  ad_id: 'utekos_ad_id',
  ad_name: 'utekos_ad_name'
} as const satisfies Record<
  (typeof CAMPAIGN_ATTRIBUTION_KEYS)[number],
  string
>

const identifierValueSchema = z.string().min(1).max(4096)
const identifierMapSchema = z.record(
  z.string().min(1),
  identifierValueSchema
)
const attributionUrlSchema = z.string().url().max(4096)
const capturedAtSchema = z.string().datetime({ offset: true })

export const checkoutAttributionSnapshotSchema = z.strictObject({
  schema_version: z.literal(1),
  captured_at: capturedAtSchema,
  consent: canonicalEventEnvelopeSchema.shape.consent,
  browser_id: identifierMapSchema.optional(),
  campaign: campaignAttributionSchema.optional(),
  click_id: identifierMapSchema.optional(),
  external_id: identifierValueSchema.optional(),
  page_url: attributionUrlSchema.optional(),
  referrer_url: attributionUrlSchema.optional()
})

export type CheckoutAttributionSnapshot = z.infer<
  typeof checkoutAttributionSnapshotSchema
>

type CheckoutAttributionSource = {
  browser_id?: Record<string, string> | undefined
  campaign?: CampaignAttribution | undefined
  click_id?:
    | CanonicalClickIds
    | Record<string, string>
    | undefined
  consent: ConsentSnapshot
  external_id?: string | undefined
  page_url?: string | undefined
  referrer_url?: string | undefined
}

type OrderNoteAttribute = { name: string; value: string }

function sanitizeAttributionUrl(value: string | undefined) {
  if (!value) return undefined

  const url = new URL(value)
  url.hash = ''
  url.search = ''
  return url.href
}

function compactRecord(input: Record<string, string>) {
  return Object.keys(input).length > 0 ? input : undefined
}

function parseIdentifier(value: string | undefined) {
  const parsed = identifierValueSchema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}

function parseAttributionUrl(value: string | undefined) {
  const parsed = attributionUrlSchema.safeParse(value)
  return parsed.success ? parsed.data : undefined
}

function selectIdentifiers(
  identifiers: Record<string, string | undefined> | undefined,
  keys: Record<string, string>
) {
  const selected: Record<string, string> = {}

  for (const key of Object.keys(keys)) {
    const value = identifiers?.[key]
    if (value) selected[key] = value
  }

  return compactRecord(selected)
}

export function createCheckoutAttributionSnapshot(
  source: CheckoutAttributionSource,
  capturedAt = new Date().toISOString()
): CheckoutAttributionSnapshot {
  const hasAnalyticsConsent =
    source.consent.analytics === 'granted'
  const hasMarketingConsent =
    source.consent.marketing === 'granted'
  const browserId = {
    ...(hasAnalyticsConsent ?
      selectIdentifiers(source.browser_id, {
        ga_client: browserAttributeKeys.ga_client,
        ga_client_id: browserAttributeKeys.ga_client_id,
        ga_cookie: browserAttributeKeys.ga_cookie,
        ga_session_id: browserAttributeKeys.ga_session_id
      })
    : {}),
    ...(hasMarketingConsent ?
      selectIdentifiers(source.browser_id, {
        fbc: browserAttributeKeys.fbc,
        fbp: browserAttributeKeys.fbp,
        sc_cookie1: browserAttributeKeys.sc_cookie1,
        uet_session: browserAttributeKeys.uet_session,
        uet_visitor: browserAttributeKeys.uet_visitor
      })
    : {})
  }
  const hasPermittedPurpose =
    hasAnalyticsConsent || hasMarketingConsent

  return checkoutAttributionSnapshotSchema.parse({
    schema_version: 1,
    captured_at: capturedAt,
    consent: source.consent,
    ...(Object.keys(browserId).length > 0 ?
      { browser_id: browserId }
    : {}),
    ...(hasMarketingConsent && source.click_id ?
      {
        click_id: selectIdentifiers(
          source.click_id,
          clickAttributeKeys
        )
      }
    : {}),
    ...(hasMarketingConsent && source.campaign ?
      { campaign: source.campaign }
    : {}),
    ...(hasMarketingConsent && source.external_id ?
      { external_id: source.external_id }
    : {}),
    ...(hasPermittedPurpose && source.page_url ?
      { page_url: sanitizeAttributionUrl(source.page_url) }
    : {}),
    ...(hasPermittedPurpose && source.referrer_url ?
      {
        referrer_url: sanitizeAttributionUrl(source.referrer_url)
      }
    : {})
  })
}

function buildCartAttributes(
  snapshot: CheckoutAttributionSnapshot
) {
  const attributes = [
    {
      key: CONSENT_ATTRIBUTE,
      value: JSON.stringify(snapshot.consent)
    }
  ]

  if (
    snapshot.consent.analytics !== 'granted' &&
    snapshot.consent.marketing !== 'granted'
  ) {
    return attributes
  }

  attributes.push({
    key: CAPTURED_AT_ATTRIBUTE,
    value: snapshot.captured_at
  })

  if (snapshot.page_url) {
    attributes.push({
      key: PAGE_URL_ATTRIBUTE,
      value: snapshot.page_url
    })
  }
  if (snapshot.referrer_url) {
    attributes.push({
      key: REFERRER_URL_ATTRIBUTE,
      value: snapshot.referrer_url
    })
  }

  for (const [field, attributeKey] of Object.entries(
    campaignAttributeKeys
  )) {
    const value =
      snapshot.campaign?.[field as keyof CampaignAttribution]
    if (value) attributes.push({ key: attributeKey, value })
  }

  for (const [identifier, attributeKey] of Object.entries(
    browserAttributeKeys
  )) {
    const value = snapshot.browser_id?.[identifier]
    if (value) attributes.push({ key: attributeKey, value })
  }

  for (const [identifier, attributeKey] of Object.entries(
    clickAttributeKeys
  )) {
    const value = snapshot.click_id?.[identifier]
    if (value) attributes.push({ key: attributeKey, value })
  }

  if (snapshot.external_id) {
    attributes.push({
      key: EXTERNAL_ID_ATTRIBUTE,
      value: snapshot.external_id
    })
  }

  return attributes
}

function attributeMap(
  noteAttributes: ReadonlyArray<OrderNoteAttribute>
) {
  return new Map(
    noteAttributes.map(attribute => [
      attribute.name,
      attribute.value
    ])
  )
}

export function parseOrderAttributionFromNoteAttributes(
  noteAttributes: ReadonlyArray<OrderNoteAttribute>
): CheckoutAttributionSnapshot {
  const attributes = attributeMap(noteAttributes)
  const consent =
    parseOrderConsentFromNoteAttributes(noteAttributes)
  const browserId: Record<string, string> = {}
  const clickId: Record<string, string> = {}
  const campaign: Partial<CampaignAttribution> = {}

  if (consent.analytics === 'granted') {
    for (const [identifier, attributeKey] of Object.entries(
      browserAttributeKeys
    )) {
      if (!identifier.startsWith('ga_')) continue
      const value = parseIdentifier(attributes.get(attributeKey))
      if (value) browserId[identifier] = value
    }
  }

  if (consent.marketing === 'granted') {
    for (const [field, attributeKey] of Object.entries(
      campaignAttributeKeys
    )) {
      const value = attributes.get(attributeKey)
      if (value) {
        campaign[field as keyof CampaignAttribution] = value
      }
    }

    for (const identifier of [
      'fbc',
      'fbp',
      'sc_cookie1',
      'uet_session',
      'uet_visitor'
    ] as const) {
      const value = parseIdentifier(
        attributes.get(browserAttributeKeys[identifier])
      )
      if (value) browserId[identifier] = value
    }

    for (const [identifier, attributeKey] of Object.entries(
      clickAttributeKeys
    )) {
      const value = parseIdentifier(attributes.get(attributeKey))
      if (value) clickId[identifier] = value
    }
  }

  const parsedCapturedAt = capturedAtSchema.safeParse(
    attributes.get(CAPTURED_AT_ATTRIBUTE)
  )
  const fallbackCapturedAt = '1970-01-01T00:00:00.000Z'
  const capturedAt =
    parsedCapturedAt.success ?
      parsedCapturedAt.data
    : fallbackCapturedAt
  const externalId =
    consent.marketing === 'granted' ?
      parseIdentifier(attributes.get(EXTERNAL_ID_ATTRIBUTE))
    : undefined
  const parsedCampaign = parseCampaignAttribution(campaign)
  const hasPermittedPurpose =
    consent.analytics === 'granted' ||
    consent.marketing === 'granted'
  const pageUrl =
    hasPermittedPurpose ?
      parseAttributionUrl(attributes.get(PAGE_URL_ATTRIBUTE))
    : undefined
  const referrerUrl =
    hasPermittedPurpose ?
      parseAttributionUrl(attributes.get(REFERRER_URL_ATTRIBUTE))
    : undefined

  return checkoutAttributionSnapshotSchema.parse({
    schema_version: 1,
    captured_at: capturedAt,
    consent,
    ...(Object.keys(browserId).length > 0 ?
      { browser_id: browserId }
    : {}),
    ...(Object.keys(clickId).length > 0 ?
      { click_id: clickId }
    : {}),
    ...(parsedCampaign ? { campaign: parsedCampaign } : {}),
    ...(externalId ? { external_id: externalId } : {}),
    ...(pageUrl ? { page_url: pageUrl } : {}),
    ...(referrerUrl ? { referrer_url: referrerUrl } : {})
  })
}

export function checkoutAttributionSnapshotToShopifyAttributes(
  snapshot: CheckoutAttributionSnapshot,
  beginCheckoutEventId?: string
) {
  const attributes = buildCartAttributes(snapshot)

  if (
    snapshot.consent.analytics === 'granted' &&
    beginCheckoutEventId
  ) {
    attributes.push({
      key: BEGIN_CHECKOUT_EVENT_ATTRIBUTE,
      value: z.string().uuid().parse(beginCheckoutEventId)
    })
  }

  return attributes
}
