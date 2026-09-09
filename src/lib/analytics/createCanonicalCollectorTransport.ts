import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import {
  applyCanonicalCollectionContext,
  type CanonicalCollectionContext
} from './applyCanonicalCollectionContext'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { clearStoredSnapchatClickId } from './clickIdSessionStore'
import { enrichCanonicalEventWithMetaAttribution } from './enrichCanonicalEventWithMetaAttribution'
import { createCollectorDeliveryError } from './createCollectorDeliveryError'
import { extractClickIds } from './pageViewClientContext'
import { enrichCanonicalBrowserJourneyContext } from './internalJourneyContext'
import { readSkreddersyVarmenLayoutAssignment } from '@/lib/experiments/skreddersyVarmenLayoutExperiment'

const COOKIEBOT_EVENTS = [
  'CookiebotOnConsentReady',
  'CookiebotOnAccept',
  'CookiebotOnDecline'
] as const

type CookiebotConsent = {
  marketing?: boolean
  preferences?: boolean
  statistics?: boolean
}

type CookiebotApi = {
  consent?: CookiebotConsent
  declined?: boolean
  hasResponse?: boolean
}

type CookiebotWindow = Window & { Cookiebot?: CookiebotApi }

type CreateCanonicalCollectorTransportInput<
  E extends { consent: ConsentSnapshot }
> = {
  analyticsEventName: string
  beaconEndpoint?: string
  endpoint: string
  fallbackEndpoint?: string
  enrichEvent?: (event: E) => Promise<E>
  hasCollectionConsent?: (event: E) => boolean
}

type SendCanonicalCollectorEventInput<
  E extends { consent: ConsentSnapshot }
> = Pick<
  CreateCanonicalCollectorTransportInput<E>,
  | 'analyticsEventName'
  | 'beaconEndpoint'
  | 'endpoint'
  | 'fallbackEndpoint'
  | 'enrichEvent'
> & { headers?: Readonly<Record<string, string>> }

function compactRecord(
  entries: Array<[string, string | undefined]>
): Record<string, string> | undefined {
  const record: Record<string, string> = {}

  for (const [key, value] of entries) {
    if (value) record[key] = value
  }

  return Object.keys(record).length > 0 ? record : undefined
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined

  const prefix = `${name}=`
  const cookie = document.cookie
    .split('; ')
    .find(candidate => candidate.startsWith(prefix))

  return cookie?.slice(prefix.length) || undefined
}

function resolveConsent(
  cookiebot: CookiebotApi | undefined,
  version: string
): ConsentSnapshot {
  return {
    analytics:
      cookiebot?.consent?.statistics === true ?
        'granted'
      : 'denied',
    marketing:
      cookiebot?.consent?.marketing === true ?
        'granted'
      : 'denied',
    preferences:
      cookiebot?.consent?.preferences === true ?
        'granted'
      : 'denied',
    source: 'cookiebot',
    version
  }
}

function resolveBrowserCollection<
  E extends { consent: ConsentSnapshot; page_url?: string }
>(event: E): { context: CanonicalCollectionContext; event: E } {
  const cookiebot =
    typeof window === 'undefined' ? undefined : (
      (window as CookiebotWindow).Cookiebot
    )

  const consent = resolveConsent(
    cookiebot,
    event.consent.version
  )
  const pageUrl = event.page_url ?? 'https://utekos.no/'
  const hasResponse =
    cookiebot?.hasResponse === true ||
    cookiebot?.declined === true

  if (hasResponse && consent.marketing !== 'granted') {
    clearStoredSnapchatClickId()
  }

  const context: CanonicalCollectionContext = {
    consent,
    hasResponse,
    ...(consent.analytics === 'granted' ?
      {
        analyticsBrowserId: compactRecord([
          ['ga_cookie', readCookie('_ga')]
        ]),
        experiment: readSkreddersyVarmenLayoutAssignment()
      }
    : {}),
    ...(consent.marketing === 'granted' ?
      {
        clickId: extractClickIds(pageUrl, document.cookie, true),
        marketingBrowserId: compactRecord([
          ['fbp', readCookie('_fbp')],
          ['fbc', readCookie('_fbc')],
          ['gcl_au', readCookie('_gcl_au')],
          ['uet_msclkid', readCookie('_uetmsclkid')],
          ['uet_sid', readCookie('_uetsid')],
          ['uet_vid', readCookie('_uetvid')],
          ['sc_cookie1', readCookie('_scid')]
        ])
      }
    : {})
  }

  return {
    context,
    event: applyCanonicalCollectionContext(event, context)
  }
}

function subscribeToCookiebotChanges(
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  for (const eventName of COOKIEBOT_EVENTS) {
    window.addEventListener(eventName, listener)
  }

  return () => {
    for (const eventName of COOKIEBOT_EVENTS) {
      window.removeEventListener(eventName, listener)
    }
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

function defaultHasCollectionConsent(event: {
  consent: ConsentSnapshot
}) {
  return (
    event.consent.analytics === 'granted' ||
    event.consent.marketing === 'granted'
  )
}

export async function sendCanonicalCollectorEvent<
  E extends { consent: ConsentSnapshot }
>(
  input: SendCanonicalCollectorEventInput<E>,
  event: E
): Promise<void> {
  let stage: Parameters<
    typeof createCollectorDeliveryError
  >[1]['stage'] = 'journey_context'
  let endpoint = input.endpoint
  let attempt = 0
  let keepalive = true
  let bodyBytes = 0
  let status: number | undefined

  try {
    const journeyEnriched =
      enrichCanonicalBrowserJourneyContext(event)
    stage = 'meta_context'
    const metaEnriched =
      await enrichCanonicalEventWithMetaAttribution(
        journeyEnriched
      )
    stage = 'event_enrichment'
    const enriched =
      input.enrichEvent ?
        await input.enrichEvent(metaEnriched)
      : metaEnriched
    stage = 'serialize'
    const body = JSON.stringify(enriched)
    const beaconBody = new Blob([body], {
      type: 'application/json'
    })
    bodyBytes = beaconBody.size
    // Beacon and keepalive fetch share the browser's 64 KiB in-flight quota.
    keepalive = bodyBytes <= 65_536

    if (
      input.beaconEndpoint &&
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      try {
        const queued = navigator.sendBeacon(
          input.beaconEndpoint,
          beaconBody
        )

        if (queued) return
      } catch {}
    }

    stage = 'request'
    for (attempt = 1; attempt <= 2; attempt += 1) {
      let response: Response
      status = undefined

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...input.headers
          },
          body,
          cache: 'no-store',
          credentials: 'same-origin',
          keepalive
        })
      } catch (error) {
        if (attempt === 2) throw error
        endpoint = input.fallbackEndpoint ?? input.endpoint
        // A visible document can retry outside the exhausted keepalive quota.
        // Hidden/unloading documents retain unload protection.
        if (
          typeof document !== 'undefined' &&
          document.visibilityState === 'visible'
        ) {
          keepalive = false
        }
        continue
      }

      status = response.status
      if (response.ok) return

      if (attempt === 2 || !isRetryableStatus(response.status)) {
        throw new Error(
          `${input.analyticsEventName} collector returned ${response.status}`
        )
      }
    }
  } catch (error) {
    throw createCollectorDeliveryError(error, {
      attempt,
      bodyBytes,
      endpoint,
      keepalive,
      stage,
      ...(status !== undefined ? { status } : {})
    })
  }
}

export function createCanonicalCollectorTransport<
  E extends { consent: ConsentSnapshot }
>(input: CreateCanonicalCollectorTransportInput<E>) {
  const hasCollectionConsent =
    input.hasCollectionConsent ?? defaultHasCollectionConsent

  function reportError(error: unknown) {
    reportClientCaughtError(
      error,
      `${input.analyticsEventName}.first_party_collector`
    )
  }

  return function startCollectorTransport(event: E): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    let finished = false
    let unsubscribe: () => void = () => {}

    const finish = () => {
      if (finished) return
      finished = true
      unsubscribe()
    }

    const evaluate = () => {
      if (finished) return

      const current = resolveBrowserCollection(event)

      if (hasCollectionConsent(current.event)) {
        finish()
        void sendCanonicalCollectorEvent(
          input,
          current.event
        ).catch(reportError)
        return
      }

      if (current.context.hasResponse) {
        finish()
      }
    }

    evaluate()

    if (!finished) {
      unsubscribe = subscribeToCookiebotChanges(evaluate)
      evaluate()
    }

    return finish
  }
}
