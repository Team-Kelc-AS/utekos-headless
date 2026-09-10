import {
  hasCookiebotStatisticsConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'
import { GA_MEASUREMENT_ID } from '../../api/constants/monitoring'
import type { CanonicalViewItem } from './viewItemEvent'
import type { ConsentSnapshot } from './canonicalEventEnvelope'

const GOOGLE_TAG_TIMEOUT_MS = 500

export type GoogleAnalyticsField = 'client_id' | 'session_id'

type GoogleTagCallback = (value: unknown) => void

export type GoogleAnalyticsBrowserIdDependencies = {
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void
  getGoogleTagValue: (
    field: GoogleAnalyticsField,
    callback: GoogleTagCallback
  ) => void
  setTimer: (
    callback: () => void,
    timeoutMs: number
  ) => ReturnType<typeof setTimeout>
  timeoutMs: number
}

type GoogleTagWindow = Window & { dataLayer?: unknown[] }

export function queueGoogleTagGet(
  dataLayer: unknown[],
  field: GoogleAnalyticsField,
  callback: GoogleTagCallback
) {
  function gtag(
    ...args: [
      command: 'get',
      target: string,
      field: GoogleAnalyticsField,
      callback: GoogleTagCallback
    ]
  ) {
    void args
    // Google documents gtag as pushing its arguments object.
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments)
  }

  gtag('get', GA_MEASUREMENT_ID, field, callback)
}

function getGoogleTagValue(
  field: GoogleAnalyticsField,
  callback: GoogleTagCallback
): void {
  if (typeof window === 'undefined') {
    callback(undefined)
    return
  }

  if (
    !hasCookiebotStatisticsConsent(
      (window as Window & { Cookiebot?: CookiebotApi }).Cookiebot
    )
  ) {
    callback(undefined)
    return
  }
  const currentWindow = window as GoogleTagWindow
  const dataLayer = currentWindow.dataLayer ?? []
  currentWindow.dataLayer = dataLayer
  queueGoogleTagGet(dataLayer, field, callback)
}

const defaultDependencies: GoogleAnalyticsBrowserIdDependencies =
  {
    clearTimer: timer => {
      clearTimeout(timer)
    },
    getGoogleTagValue,
    setTimer: (callback, timeoutMs) =>
      setTimeout(callback, timeoutMs),
    timeoutMs: GOOGLE_TAG_TIMEOUT_MS
  }

function normalizeGoogleTagValue(
  value: unknown
): string | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return undefined
}

function readGoogleTagValue(
  field: GoogleAnalyticsField,
  dependencies: GoogleAnalyticsBrowserIdDependencies
): Promise<string | undefined> {
  return new Promise(resolve => {
    let settled = false

    const finish = (value?: string) => {
      if (settled) return

      settled = true
      dependencies.clearTimer(timer)
      resolve(value)
    }

    const timer = dependencies.setTimer(
      () => finish(),
      dependencies.timeoutMs
    )

    try {
      dependencies.getGoogleTagValue(field, value => {
        finish(normalizeGoogleTagValue(value))
      })
    } catch {
      finish()
    }
  })
}

export async function enrichCanonicalEventWithGoogleAnalyticsIds<
  E extends {
    browser_id?: Record<string, string> | undefined
    consent: ConsentSnapshot
  }
>(
  event: E,
  dependencies: GoogleAnalyticsBrowserIdDependencies = defaultDependencies
): Promise<E> {
  if (event.consent.analytics !== 'granted') return event

  const [clientId, sessionId] = await Promise.all([
    readGoogleTagValue('client_id', dependencies),
    readGoogleTagValue('session_id', dependencies)
  ])

  if (!clientId && !sessionId) return event

  return {
    ...event,
    browser_id: {
      ...event.browser_id,
      ...(clientId ? { ga_client_id: clientId } : {}),
      ...(sessionId ? { ga_session_id: sessionId } : {})
    }
  }
}

export function enrichCanonicalViewItemWithGoogleAnalyticsIds(
  event: CanonicalViewItem,
  dependencies: GoogleAnalyticsBrowserIdDependencies = defaultDependencies
) {
  return enrichCanonicalEventWithGoogleAnalyticsIds(
    event,
    dependencies
  )
}
