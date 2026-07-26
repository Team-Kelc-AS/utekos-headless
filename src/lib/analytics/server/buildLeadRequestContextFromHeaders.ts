import 'server-only'

import { geolocation, ipAddress } from '@vercel/functions'
import type { CanonicalGenerateLeadRequestContext } from './normalizeCanonicalGenerateLead'

type LeadRequestGeolocation = {
  city?: string
  country?: string
  countryRegion?: string
  postalCode?: string
}

type LeadRequestContextDependencies = {
  geolocation: (request: Request) => LeadRequestGeolocation
  ipAddress: (request: Request) => string | undefined
}

const REQUEST_CONTEXT_URL = 'https://utekos.no/'

const defaultDependencies: LeadRequestContextDependencies = {
  geolocation,
  ipAddress
}

export function buildLeadRequestContextFromHeaders(
  requestHeaders: Headers,
  dependencies: LeadRequestContextDependencies = defaultDependencies
): CanonicalGenerateLeadRequestContext {
  const request = new Request(REQUEST_CONTEXT_URL, {
    headers: new Headers(requestHeaders)
  })
  const geo = dependencies.geolocation(request)
  const clientIpAddress = dependencies.ipAddress(request)
  const userAgent =
    request.headers.get('user-agent') ?? undefined

  return {
    ...(geo.city ? { city: geo.city } : {}),
    ...(clientIpAddress ? { clientIpAddress } : {}),
    ...(geo.country ? { countryCode: geo.country } : {}),
    ...(geo.postalCode ? { postalCode: geo.postalCode } : {}),
    ...(geo.countryRegion ?
      { regionCode: geo.countryRegion }
    : {}),
    ...(userAgent ? { userAgent } : {})
  }
}
