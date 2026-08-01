const LANDING_EDGE_SERVER_TIMING_NAME = 'utekos_edge'
const LANDING_EDGE_AUTH_SERVER_TIMING_NAME = 'utekos_edge_auth'
const LANDING_EDGE_CORRELATION_COOKIE_NAME =
  '__Host-utekos-edge-correlation'

type ServerTimingEntryLike = {
  description: string
  name: string
}

type NavigationTimingLike = {
  name: string
  serverTiming: readonly ServerTimingEntryLike[]
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

const correlationCookieValuePattern =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(\d{10}\.[A-Za-z0-9_-]{43})$/iu

export function readLandingEdgeCorrelationCookie(
  cookieHeader: string
) {
  const value = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie =>
      cookie.startsWith(
        `${LANDING_EDGE_CORRELATION_COOKIE_NAME}=`
      )
    )
    ?.slice(LANDING_EDGE_CORRELATION_COOKIE_NAME.length + 1)

  if (!value) return undefined

  let decodedValue: string
  try {
    decodedValue = decodeURIComponent(value)
  } catch {
    return undefined
  }

  const match = correlationCookieValuePattern.exec(decodedValue)
  if (!match) return undefined

  const edgeRequestId = match[1]
  const token = match[2]
  if (!edgeRequestId || !token) return undefined

  return { edgeRequestId, token }
}

export function readLandingEdgeRequestId(
  currentUrl: string,
  navigationEntries: readonly NavigationTimingLike[]
) {
  const navigation = navigationEntries.find(entry => {
    try {
      const entryUrl = new URL(entry.name)
      const current = new URL(currentUrl)

      return (
        entryUrl.origin === current.origin &&
        entryUrl.pathname === current.pathname
      )
    } catch {
      return false
    }
  })
  const edgeTiming = navigation?.serverTiming.find(
    entry => entry.name === LANDING_EDGE_SERVER_TIMING_NAME
  )
  const candidate = edgeTiming?.description.trim()

  return candidate && isUuid(candidate) ? candidate : undefined
}

export function readLandingEdgeCorrelation(
  currentUrl: string,
  navigationEntries: readonly NavigationTimingLike[]
) {
  const edgeRequestId = readLandingEdgeRequestId(
    currentUrl,
    navigationEntries
  )
  if (!edgeRequestId) return undefined

  const navigation = navigationEntries.find(entry => {
    try {
      const entryUrl = new URL(entry.name)
      const current = new URL(currentUrl)

      return (
        entryUrl.origin === current.origin &&
        entryUrl.pathname === current.pathname
      )
    } catch {
      return false
    }
  })
  const token = navigation?.serverTiming
    .find(
      entry =>
        entry.name === LANDING_EDGE_AUTH_SERVER_TIMING_NAME
    )
    ?.description.trim()

  if (!token || !/^\d{10}\.[A-Za-z0-9_-]{43}$/u.test(token)) {
    return undefined
  }

  return { edgeRequestId, token }
}

export function readBrowserLandingEdgeRequestId(
  currentUrl: string
) {
  if (typeof performance === 'undefined') return undefined

  const timingRequestId = readLandingEdgeRequestId(
    currentUrl,
    performance.getEntriesByType(
      'navigation'
    ) as unknown as PerformanceNavigationTiming[]
  )

  if (timingRequestId) return timingRequestId
  if (typeof document === 'undefined') return undefined

  return readLandingEdgeCorrelationCookie(document.cookie)
    ?.edgeRequestId
}

export function readBrowserLandingEdgeCorrelation(
  currentUrl: string
) {
  if (typeof performance === 'undefined') return undefined

  const timingCorrelation = readLandingEdgeCorrelation(
    currentUrl,
    performance.getEntriesByType(
      'navigation'
    ) as unknown as PerformanceNavigationTiming[]
  )

  if (timingCorrelation) return timingCorrelation
  if (typeof document === 'undefined') return undefined

  return readLandingEdgeCorrelationCookie(document.cookie)
}

export {
  LANDING_EDGE_AUTH_SERVER_TIMING_NAME,
  LANDING_EDGE_CORRELATION_COOKIE_NAME,
  LANDING_EDGE_SERVER_TIMING_NAME
}
