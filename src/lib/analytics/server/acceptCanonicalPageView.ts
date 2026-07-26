import type { CookieSettings } from 'capi-param-builder-nodejs'
import type { CanonicalPageView } from '../pageViewEvent'
import { ensureCanonicalMetaBrowserIds } from './ensureCanonicalMetaBrowserIds'
import {
  normalizeCanonicalPageView,
  type CanonicalPageViewRequestContext
} from './normalizeCanonicalPageView'
import { planCanonicalEventDispatch } from './planCanonicalEventDispatch'
import type {
  CanonicalEventStore,
  CanonicalEventStoreInput
} from './canonicalEventStore'
import { canonicalPageViewSchema } from '../pageViewEvent'

export type CanonicalPageViewStoreInput =
  CanonicalEventStoreInput & { event: CanonicalPageView }

export type CanonicalPageViewStore = CanonicalEventStore

type AcceptCanonicalPageViewInput = {
  payload: unknown
  requestContext: CanonicalPageViewRequestContext
  store: CanonicalPageViewStore
}

export type AcceptCanonicalPageViewResult =
  | {
      cookiesToSet: CookieSettings[]
      event_id: string
      status: 'accepted' | 'duplicate'
    }
  | {
      cookiesToSet: CookieSettings[]
      reason: 'consent_denied'
      status: 'rejected'
    }

export async function acceptCanonicalPageView(
  input: AcceptCanonicalPageViewInput
): Promise<AcceptCanonicalPageViewResult> {
  const normalized = normalizeCanonicalPageView(
    input.payload,
    input.requestContext
  )
  const hasPermittedPurpose =
    normalized.consent.analytics === 'granted' ||
    normalized.consent.marketing === 'granted'

  if (!hasPermittedPurpose) {
    console.info(
      '[tracking] page_view rejected: consent denied',
      JSON.stringify({
        event_id: normalized.event_id,
        page_view_id: normalized.page_view_id,
        page_url: normalized.page_url,
        environment: normalized.environment,
        consent: normalized.consent
      })
    )
    return {
      cookiesToSet: [],
      reason: 'consent_denied',
      status: 'rejected'
    }
  }

  const ensured = ensureCanonicalMetaBrowserIds({
    ...(normalized.browser_id ?
      { browserId: normalized.browser_id }
    : {}),
    ...(normalized.click_id ? { clickId: normalized.click_id } : {}),
    ...(input.requestContext.clientIpAddress ?
      { clientIpAddress: input.requestContext.clientIpAddress }
    : {}),
    consent: normalized.consent,
    ...(input.requestContext.cookieHeader ?
      { cookieHeader: input.requestContext.cookieHeader }
    : {}),
    pageUrl: normalized.page_url,
    ...(input.requestContext.requestUrl ?
      { requestUrl: input.requestContext.requestUrl }
    : {})
  })

  const event = canonicalPageViewSchema.parse({
    ...normalized,
    ...(ensured.browserId ? { browser_id: ensured.browserId } : {}),
    ...(ensured.clickId ? { click_id: ensured.clickId } : {})
  })

  const result = await input.store.accept({
    dispatches: planCanonicalEventDispatch(event),
    event
  })
  const status =
    result.status === 'inserted' ? 'accepted' : 'duplicate'

  console.info(
    '[tracking] page_view store result',
    JSON.stringify({
      event_id: event.event_id,
      page_view_id: event.page_view_id,
      page_url: event.page_url,
      environment: event.environment,
      status,
      cookies_to_set: ensured.cookiesToSet.map(cookie => cookie.name),
      has_fbp: Boolean(event.browser_id?.fbp),
      has_fbc: Boolean(event.browser_id?.fbc),
      has_external_id: Boolean(event.external_id)
    })
  )

  return {
    cookiesToSet: ensured.cookiesToSet,
    event_id: event.event_id,
    status
  }
}
