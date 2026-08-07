import {
  canonicalPageViewSchema,
  type CanonicalPageView
} from '../pageViewEvent'
import { normalizeCanonicalBrowserEvent } from './normalizeCanonicalBrowserEvent'

export type CanonicalPageViewRequestContext = {
  city?: string
  clientIpAddress?: string
  cookieHeader?: string
  countryCode?: string
  postalCode?: string
  regionCode?: string
  requestUrl?: string
  userAgent?: string
}

export function normalizeCanonicalPageView(
  payload: unknown,
  requestContext: CanonicalPageViewRequestContext
): CanonicalPageView {
  return normalizeCanonicalBrowserEvent(
    canonicalPageViewSchema,
    payload,
    requestContext
  )
}
