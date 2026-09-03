import { protos } from '@google-ads/datamanager'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import { findGoogleClientId } from './findGoogleClientId'

type DataManagerParameter =
  protos.google.ads.datamanager.v1.IEventParameter

export const MAX_PARAMETER_VALUE_LENGTH = 100
export const MAX_ADDITIONAL_ITEM_PARAMETERS = 24
export const MAX_PAGE_LOCATION_LENGTH =
  MAX_PARAMETER_VALUE_LENGTH
export const MAX_PAGE_REFERRER_LENGTH =
  MAX_PARAMETER_VALUE_LENGTH
export const MAX_PAGE_TITLE_LENGTH = MAX_PARAMETER_VALUE_LENGTH
export const MAX_USER_IDENTIFIERS = 10
export const IP_MATCHING_RESTRICTED_COUNTRY_CODES = new Set([
  'AT',
  'BE',
  'BG',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GB',
  'GR',
  'HR',
  'HU',
  'IE',
  'IS',
  'IT',
  'LI',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
  'UK'
])
const { ConsentStatus } = protos.google.ads.datamanager.v1

type MappableBrowserEvent = Omit<
  Pick<
    CanonicalEventEnvelope,
    | 'browser_id'
    | 'click_id'
    | 'client_ip_address'
    | 'consent'
    | 'event_device_info'
    | 'external_id'
    | 'impression_id'
    | 'location'
    | 'user_data'
  >,
  'consent'
> & {
  consent: { marketing: 'denied' | 'granted' | 'unknown' }
  referrer_url?: string | undefined
}

export function resolveGoogleClientId(
  browserId: CanonicalEventEnvelope['browser_id']
) {
  const clientId = findGoogleClientId(browserId)
  if (clientId) return clientId

  throw new Error(
    'Google Data Manager event requires a valid GA client ID'
  )
}

export function mapGoogleDataManagerTimestamp(
  eventTime: string,
  now = Date.now()
) {
  const milliseconds = Date.parse(eventTime)

  if (!Number.isFinite(milliseconds) || !Number.isFinite(now)) {
    throw new Error(
      'Google Data Manager event_time must be a valid timestamp'
    )
  }

  const providerMilliseconds = Math.min(milliseconds, now)

  return {
    seconds: Math.floor(providerMilliseconds / 1000),
    nanos: (providerMilliseconds % 1000) * 1_000_000
  }
}

export function googleDataManagerParameter(
  parameterName: string,
  value: string | number | boolean | null | undefined,
  maxLength = MAX_PARAMETER_VALUE_LENGTH
): DataManagerParameter | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return {
    parameterName,
    value: Array.from(String(value)).slice(0, maxLength).join('')
  }
}

export function googleDataManagerIdentifierParameter(
  parameterName: string,
  value: string | null | undefined
) {
  if (
    !value ||
    Array.from(value).length > MAX_PARAMETER_VALUE_LENGTH
  ) {
    return undefined
  }

  return { parameterName, value }
}

function encodePathnameUnits(pathname: string) {
  const units: string[] = []

  for (const [index, segment] of pathname.split('/').entries()) {
    if (index > 0) units.push('/')

    for (const codePoint of Array.from(
      decodeURIComponent(segment)
    )) {
      units.push(encodeURIComponent(codePoint))
    }
  }

  return units
}

function truncateUrlToOriginAndPathname(
  url: URL,
  maxLength: number
) {
  const availablePathLength = maxLength - url.origin.length

  if (availablePathLength < 1) return undefined

  const pathname: string[] = []
  let pathnameLength = 0

  for (const unit of encodePathnameUnits(url.pathname)) {
    if (pathnameLength + unit.length > availablePathLength) break

    pathname.push(unit)
    pathnameLength += unit.length
  }

  return `${url.origin}${pathname.join('')}`
}

export function normalizeGoogleReferrerUrl(
  value: string | undefined
) {
  if (!value) return undefined

  const url = new URL(value)
  const normalized = `${url.origin}${url.pathname}`

  if (normalized.length <= MAX_PAGE_REFERRER_LENGTH) {
    return normalized
  }

  return truncateUrlToOriginAndPathname(
    url,
    MAX_PAGE_REFERRER_LENGTH
  )
}

export function limitGooglePageLocation(value: string) {
  const url = new URL(value)

  if (url.href.length <= MAX_PAGE_LOCATION_LENGTH) return value

  url.hash = ''

  if (url.href.length <= MAX_PAGE_LOCATION_LENGTH) {
    return url.href
  }

  url.search = ''

  if (url.href.length <= MAX_PAGE_LOCATION_LENGTH) {
    return url.href
  }

  return (
    truncateUrlToOriginAndPathname(
      url,
      MAX_PAGE_LOCATION_LENGTH
    ) ?? url.origin
  )
}

export function compactGoogleDataManagerParameters(
  parameters: Array<DataManagerParameter | undefined>
) {
  return parameters.filter(
    (candidate): candidate is DataManagerParameter =>
      candidate !== undefined
  )
}

export function mapGoogleDataManagerConsent(
  consent: MappableBrowserEvent['consent']
) {
  const advertisingConsent =
    consent.marketing === 'granted' ?
      ConsentStatus.CONSENT_GRANTED
    : ConsentStatus.CONSENT_DENIED

  return {
    adUserData: advertisingConsent,
    adPersonalization: advertisingConsent
  }
}

export function mapGoogleDataManagerUserData(
  event: MappableBrowserEvent
) {
  if (event.consent.marketing !== 'granted') return undefined

  const emailAddresses = [
    ...new Set(event.user_data?.email_sha256 ?? [])
  ]
  const phoneNumbers = [
    ...new Set(event.user_data?.phone_sha256 ?? [])
  ]
  const userIdentifiers: Array<
    { emailAddress: string } | { phoneNumber: string }
  > = []

  for (
    let index = 0;
    userIdentifiers.length < MAX_USER_IDENTIFIERS &&
    (index < emailAddresses.length ||
      index < phoneNumbers.length);
    index += 1
  ) {
    const emailAddress = emailAddresses[index]
    const phoneNumber = phoneNumbers[index]

    if (emailAddress) userIdentifiers.push({ emailAddress })
    if (
      phoneNumber &&
      userIdentifiers.length < MAX_USER_IDENTIFIERS
    ) {
      userIdentifiers.push({ phoneNumber })
    }
  }

  return userIdentifiers.length > 0 ?
      { userIdentifiers }
    : undefined
}

export function mapGoogleDataManagerAdIdentifiers(
  event: MappableBrowserEvent
) {
  if (event.consent.marketing !== 'granted') return undefined

  const identifiers = {
    ...(event.click_id?.dclid ?
      { dclid: event.click_id.dclid }
    : {}),
    ...(event.click_id?.gbraid ?
      { gbraid: event.click_id.gbraid }
    : {}),
    ...(event.click_id?.gclid ?
      { gclid: event.click_id.gclid }
    : {}),
    ...(event.click_id?.wbraid ?
      { wbraid: event.click_id.wbraid }
    : {}),
    ...(event.impression_id ?
      { impressionId: event.impression_id }
    : {})
  }

  return Object.keys(identifiers).length > 0 ?
      identifiers
    : undefined
}

export function mapGoogleDataManagerDeviceInfo(
  event: MappableBrowserEvent
) {
  const source = event.event_device_info
  const countryCode = event.location?.country_code?.toUpperCase()
  const ipAddress =
    (
      countryCode &&
      !IP_MATCHING_RESTRICTED_COUNTRY_CODES.has(countryCode)
    ) ?
      event.client_ip_address
    : undefined
  const deviceInfo = {
    ...(ipAddress ? { ipAddress } : {}),
    ...(source?.user_agent ?
      { userAgent: source.user_agent }
    : {}),
    ...(source?.language ?
      { languageCode: source.language }
    : {}),
    ...(source?.screen_height === undefined ?
      {}
    : { screenHeight: source.screen_height }),
    ...(source?.screen_width === undefined ?
      {}
    : { screenWidth: source.screen_width })
  }

  return Object.keys(deviceInfo).length > 0 ?
      deviceInfo
    : undefined
}

export function mapGoogleDataManagerEventLocation(
  event: MappableBrowserEvent
) {
  const location = event.location
  const eventLocation = {
    ...(location?.city ? { city: location.city } : {}),
    ...(location?.country_code ?
      { regionCode: location.country_code.toUpperCase() }
    : {})
  }

  return Object.keys(eventLocation).length > 0 ?
      eventLocation
    : undefined
}
