const LANDING_EDGE_SERVER_TIMING_NAME = 'utekos_edge'
const LANDING_EDGE_AUTH_SERVER_TIMING_NAME = 'utekos_edge_auth'

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

  return readLandingEdgeRequestId(
    currentUrl,
    performance.getEntriesByType(
      'navigation'
    ) as unknown as PerformanceNavigationTiming[]
  )
}

export function readBrowserLandingEdgeCorrelation(
  currentUrl: string
) {
  if (typeof performance === 'undefined') return undefined

  return readLandingEdgeCorrelation(
    currentUrl,
    performance.getEntriesByType(
      'navigation'
    ) as unknown as PerformanceNavigationTiming[]
  )
}

export {
  LANDING_EDGE_AUTH_SERVER_TIMING_NAME,
  LANDING_EDGE_SERVER_TIMING_NAME
}
