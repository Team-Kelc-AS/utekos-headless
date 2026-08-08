import 'server-only'

import {
  buildGenerateLeadDataLayerEvent,
  createCanonicalGenerateLead,
  type GenerateLeadDataLayerEvent
} from '../generateLeadEvent'
import type { ConsentSnapshot } from '../canonicalEventEnvelope'
import {
  presentCanonicalSignal,
  unavailableCanonicalSignal,
  type CanonicalClickIds,
  type CanonicalSignalAudit
} from '../canonicalSignalContract'
import { buildLeadUserDataHashes } from '../buildLeadUserDataHashes'
import {
  extractBrowserIds,
  extractClickIds
} from '../pageViewClientContext'
import { FIRST_PARTY_EXTERNAL_ID_COOKIE } from '../firstPartyExternalId'
import type {
  LeadFormId,
  LeadType
} from '@/lib/leads/leadFormIds'
import { acceptCanonicalGenerateLead } from './acceptCanonicalGenerateLead'
import type { CanonicalGenerateLeadRequestContext } from './normalizeCanonicalGenerateLead'
import { postgresCanonicalEventStore } from './postgresCanonicalPageViewStore'
import { processMetaParameterContext } from './processMetaParameterContext'
import { resolveCanonicalEnvironment } from './resolveCanonicalEnvironment'

function readCookie(
  cookieHeader: string,
  name: string
): string | undefined {
  const prefix = `${name}=`

  for (const part of cookieHeader.split(';')) {
    const candidate = part.trim()
    if (!candidate.startsWith(prefix)) continue

    const value = candidate.slice(prefix.length)
    if (!value) return undefined

    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return undefined
}

function parseCookieMap(
  cookieHeader: string
): Record<string, string> {
  const cookies: Record<string, string> = {}

  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1) continue

    const name = part.slice(0, separator).trim()
    const rawValue = part.slice(separator + 1).trim()
    if (!name || !rawValue) continue

    try {
      cookies[name] = decodeURIComponent(rawValue)
    } catch {
      cookies[name] = rawValue
    }
  }

  return cookies
}

function nonEmptyClickIds(
  clickIds: Record<string, string> | undefined
): CanonicalClickIds | undefined {
  if (!clickIds || Object.keys(clickIds).length === 0) {
    return undefined
  }

  return clickIds
}

function buildGenerateLeadSignalAudit(input: {
  assessedAt: string
  clickId?: CanonicalClickIds
  clientIpAddress?: string
  externalId?: string
  fbc?: string
  fbcSource?: 'first_party_cookie' | 'meta_parameter_builder'
  fbp?: string
  fbpSource?: 'first_party_cookie' | 'meta_parameter_builder'
  marketingGranted: boolean
  snapCookie1?: string
  userAgent?: string
}): CanonicalSignalAudit {
  const {
    assessedAt,
    clickId,
    clientIpAddress,
    externalId,
    fbc,
    fbcSource,
    fbp,
    fbpSource,
    marketingGranted,
    snapCookie1,
    userAgent
  } = input

  if (!marketingGranted) {
    return {
      event_source_url: presentCanonicalSignal(
        'browser_document',
        assessedAt
      ),
      client_ip_address:
        clientIpAddress ?
          presentCanonicalSignal(
            'vercel_request_context',
            assessedAt
          )
        : unavailableCanonicalSignal(
            'consent_denied',
            assessedAt
          ),
      client_user_agent:
        userAgent ?
          presentCanonicalSignal(
            'vercel_request_context',
            assessedAt
          )
        : unavailableCanonicalSignal(
            'consent_denied',
            assessedAt
          ),
      external_id: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      ),
      click_ids: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      ),
      meta_fbclid: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      ),
      meta_fbc: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      ),
      meta_fbp: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      ),
      snap_click_id: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      ),
      snap_cookie1: unavailableCanonicalSignal(
        'consent_denied',
        assessedAt
      )
    }
  }

  const hasClickIds = Boolean(
    clickId && Object.keys(clickId).length > 0
  )
  const fbclid = clickId?.fbclid
  const snapClickId = clickId?.snap_click_id

  return {
    event_source_url: presentCanonicalSignal(
      'browser_document',
      assessedAt
    ),
    client_ip_address:
      clientIpAddress ?
        presentCanonicalSignal(
          'vercel_request_context',
          assessedAt
        )
      : unavailableCanonicalSignal('not_observed', assessedAt),
    client_user_agent:
      userAgent ?
        presentCanonicalSignal(
          'vercel_request_context',
          assessedAt
        )
      : unavailableCanonicalSignal('not_observed', assessedAt),
    external_id:
      externalId ?
        presentCanonicalSignal(
          'first_party_external_id_cookie',
          assessedAt
        )
      : unavailableCanonicalSignal('not_observed', assessedAt),
    click_ids:
      hasClickIds ?
        presentCanonicalSignal('browser_request_url', assessedAt)
      : unavailableCanonicalSignal(
          'no_applicable_click',
          assessedAt
        ),
    meta_fbclid:
      fbclid ?
        presentCanonicalSignal('browser_request_url', assessedAt)
      : unavailableCanonicalSignal(
          'no_applicable_click',
          assessedAt
        ),
    meta_fbc:
      fbc && fbcSource ?
        presentCanonicalSignal(fbcSource, assessedAt)
      : unavailableCanonicalSignal(
          fbclid ? 'not_observed' : 'no_applicable_click',
          assessedAt
        ),
    meta_fbp:
      fbp && fbpSource ?
        presentCanonicalSignal(fbpSource, assessedAt)
      : unavailableCanonicalSignal('not_observed', assessedAt),
    snap_click_id:
      snapClickId ?
        presentCanonicalSignal('browser_request_url', assessedAt)
      : unavailableCanonicalSignal(
          'no_applicable_click',
          assessedAt
        ),
    snap_cookie1:
      snapCookie1 ?
        presentCanonicalSignal('first_party_cookie', assessedAt)
      : unavailableCanonicalSignal('not_observed', assessedAt)
  }
}

export type RecordAcceptedGenerateLeadInput = {
  consent: ConsentSnapshot
  cookieHeader?: string
  email?: string
  formId: LeadFormId
  leadType: LeadType
  pageUrl: string
  pageViewId?: string
  phone?: string
  requestContext: CanonicalGenerateLeadRequestContext
  submissionId: string
}

export type RecordAcceptedGenerateLeadResult =
  | {
      dataLayerEvent: GenerateLeadDataLayerEvent
      eventId: string
      status: 'accepted' | 'duplicate'
    }
  | { reason: 'consent_denied'; status: 'skipped' }

export async function recordAcceptedGenerateLead(
  input: RecordAcceptedGenerateLeadInput
): Promise<RecordAcceptedGenerateLeadResult> {
  const userData = buildLeadUserDataHashes({
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {})
  })
  const cookieHeader = input.cookieHeader ?? ''
  const marketingGranted = input.consent.marketing === 'granted'
  const eventTime = new Date().toISOString()

  const extractedBrowserId = extractBrowserIds(
    cookieHeader,
    input.consent
  )
  const extractedClickId =
    marketingGranted ?
      nonEmptyClickIds(extractClickIds(input.pageUrl))
    : undefined
  const externalId =
    marketingGranted ?
      readCookie(cookieHeader, FIRST_PARTY_EXTERNAL_ID_COOKIE)
    : undefined
  const snapCookie1 =
    marketingGranted ? extractedBrowserId?.sc_cookie1 : undefined

  let fbc =
    marketingGranted ? extractedBrowserId?.fbc : undefined
  let fbcSource:
    | 'first_party_cookie'
    | 'meta_parameter_builder'
    | undefined = fbc ? 'first_party_cookie' : undefined
  let fbp =
    marketingGranted ? extractedBrowserId?.fbp : undefined
  let fbpSource:
    | 'first_party_cookie'
    | 'meta_parameter_builder'
    | undefined = fbp ? 'first_party_cookie' : undefined

  if (marketingGranted && extractedClickId?.fbclid && !fbc) {
    const derived = processMetaParameterContext({
      ...(input.requestContext.clientIpAddress ?
        { clientIpAddress: input.requestContext.clientIpAddress }
      : {}),
      cookies: parseCookieMap(cookieHeader),
      payload: {
        consent: input.consent,
        page_url: input.pageUrl,
        fbclid: extractedClickId.fbclid
      }
    })

    if (derived.identifiers.fbc) {
      fbc = derived.identifiers.fbc
      fbcSource = 'meta_parameter_builder'
    }

    if (derived.identifiers.fbp && !fbp) {
      fbp = derived.identifiers.fbp
      fbpSource = 'meta_parameter_builder'
    }
  }

  const browserId =
    marketingGranted ?
      {
        ...(extractedBrowserId ?? {}),
        ...(fbc ? { fbc } : {}),
        ...(fbp ? { fbp } : {})
      }
    : extractedBrowserId

  const signalAudit = buildGenerateLeadSignalAudit({
    assessedAt: eventTime,
    ...(extractedClickId ? { clickId: extractedClickId } : {}),
    ...(input.requestContext.clientIpAddress ?
      { clientIpAddress: input.requestContext.clientIpAddress }
    : {}),
    ...(externalId ? { externalId } : {}),
    ...(fbc ? { fbc } : {}),
    ...(fbcSource ? { fbcSource } : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbpSource ? { fbpSource } : {}),
    marketingGranted,
    ...(snapCookie1 ? { snapCookie1 } : {}),
    ...(input.requestContext.userAgent ?
      { userAgent: input.requestContext.userAgent }
    : {})
  })

  const event = createCanonicalGenerateLead({
    consent: input.consent,
    customData: {
      submission_id: input.submissionId,
      form_id: input.formId,
      lead_type: input.leadType,
      currency: 'NOK',
      value: 0
    },
    environment: resolveCanonicalEnvironment(),
    eventId: input.submissionId,
    eventTime,
    pageUrl: input.pageUrl,
    signalAudit,
    ...(input.pageViewId ?
      { pageViewId: input.pageViewId }
    : {}),
    ...(browserId && Object.keys(browserId).length > 0 ?
      { browserId }
    : {}),
    ...(extractedClickId ? { clickId: extractedClickId } : {}),
    ...(input.requestContext.clientIpAddress ?
      { clientIpAddress: input.requestContext.clientIpAddress }
    : {}),
    ...(externalId ? { externalId } : {}),
    ...(input.requestContext.userAgent ?
      {
        eventDeviceInfo: {
          userAgent: input.requestContext.userAgent
        }
      }
    : {}),
    ...(Object.keys(userData).length > 0 ? { userData } : {})
  })

  const result = await acceptCanonicalGenerateLead({
    payload: event,
    requestContext: input.requestContext,
    store: postgresCanonicalEventStore
  })

  if (result.status === 'rejected') {
    return { reason: 'consent_denied', status: 'skipped' }
  }

  return {
    dataLayerEvent: buildGenerateLeadDataLayerEvent(result.event),
    eventId: result.event_id,
    status: result.status
  }
}
