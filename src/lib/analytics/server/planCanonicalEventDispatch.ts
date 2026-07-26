import type { CanonicalEvent } from '../canonicalEvent'
import {
  getEventCatalogEntry,
  type ProviderId as CatalogProviderId
} from '../eventCatalog'
import type { ProviderId } from './providerAdapter'
import { findGoogleClientId } from './findGoogleClientId'
import { findMicrosoftClickId } from './findMicrosoftClickId'
import {
  classifyGoogleDataManagerEventFreshness,
  type GoogleDataManagerEventFreshness
} from './googleDataManagerEventFreshness'
import { resolveMicrosoftUetCapiTokenFromEnv } from './microsoftUetCapiTokenEnvKeys'

type ActiveProviderDispatchIntent = {
  dispatch_mode: 'server_retry'
  event_id: string
  google_event_freshness?: GoogleDataManagerEventFreshness
  provider: ProviderId
}

type ProviderSkipReason =
  | 'missing_capi_token'
  | 'missing_client_id'
  | 'missing_google_analytics_identifier'
  | 'missing_msclkid'
  | 'google_event_outside_72h'

type SkippedProviderDispatchIntent =
  ActiveProviderDispatchIntent & {
    skip_reason: ProviderSkipReason
    status: 'skipped_unqualified'
  }

export type ProviderDispatchIntent =
  | ActiveProviderDispatchIntent
  | SkippedProviderDispatchIntent

const outboxProviderIds = [
  'google',
  'meta',
  'microsoft_uet'
] as const satisfies readonly ProviderId[]

type Dependencies = { now: () => number }

const defaultDependencies: Dependencies = { now: Date.now }

function hasGoogleAnalyticsPurchaseIdentifier(
  event: Extract<CanonicalEvent, { event_name: 'purchase' }>
) {
  if (findGoogleClientId(event.browser_id)) return true
  if (event.consent.marketing !== 'granted') return false

  return Boolean(event.click_id?.gclid || event.external_id)
}

function hasRequiredConsent(
  requirement: ReturnType<
    typeof getEventCatalogEntry
  >['providers'][CatalogProviderId]['consentRequirement'],
  event: CanonicalEvent
) {
  switch (requirement) {
    case 'analytics':
      return event.consent.analytics === 'granted'
    case 'marketing':
      return event.consent.marketing === 'granted'
    case 'analytics_or_marketing':
      return (
        event.consent.analytics === 'granted' ||
        event.consent.marketing === 'granted'
      )
    case 'analytics_or_operational':
      return event.consent.analytics === 'granted'
    case 'none':
      return true
    case 'operational':
      // Transaction events (purchase/refund) are operationally
      // eligible for outbox planning; provider-specific analytics
      // or marketing gates still apply via their own requirements.
      return true
  }
}

export function planCanonicalEventDispatch(
  event: CanonicalEvent,
  dependencies: Dependencies = defaultDependencies
): ProviderDispatchIntent[] {
  const catalogEntry = getEventCatalogEntry(event.event_name)

  if (catalogEntry.lifecycle !== 'active') return []

  return outboxProviderIds.flatMap(provider => {
    const providerEntry = catalogEntry.providers[provider]

    if (providerEntry.serverOutbox !== 'active') return []
    if (
      providerEntry.support !== 'supported' ||
      providerEntry.productionStatus !== 'active'
    ) {
      throw new Error(
        `${provider}:${event.event_name} has an inconsistent active outbox catalog entry`
      )
    }
    if (
      !hasRequiredConsent(
        providerEntry.consentRequirement,
        event
      )
    ) {
      return []
    }

    if (
      provider === 'google' &&
      event.event_name === 'purchase'
    ) {
      const googleEventFreshness =
        classifyGoogleDataManagerEventFreshness(
          event.event_time,
          dependencies.now()
        )
      const baseIntent = {
        dispatch_mode: 'server_retry' as const,
        event_id: event.event_id,
        google_event_freshness: googleEventFreshness,
        provider
      }

      if (googleEventFreshness === 'outside_72h') {
        return [
          {
            ...baseIntent,
            skip_reason: 'google_event_outside_72h' as const,
            status: 'skipped_unqualified' as const
          }
        ]
      }

      if (!hasGoogleAnalyticsPurchaseIdentifier(event)) {
        return [
          {
            ...baseIntent,
            skip_reason:
              'missing_google_analytics_identifier' as const,
            status: 'skipped_unqualified' as const
          }
        ]
      }

      return [baseIntent]
    }

    if (
      provider === 'google' &&
      !findGoogleClientId(event.browser_id)
    ) {
      return [
        {
          dispatch_mode: 'server_retry' as const,
          event_id: event.event_id,
          provider,
          skip_reason: 'missing_client_id' as const,
          status: 'skipped_unqualified' as const
        }
      ]
    }

    if (provider === 'microsoft_uet') {
      if (!resolveMicrosoftUetCapiTokenFromEnv()) {
        return [
          {
            dispatch_mode: 'server_retry' as const,
            event_id: event.event_id,
            provider,
            skip_reason: 'missing_capi_token' as const,
            status: 'skipped_unqualified' as const
          }
        ]
      }

      if (!findMicrosoftClickId(event.click_id)) {
        return [
          {
            dispatch_mode: 'server_retry' as const,
            event_id: event.event_id,
            provider,
            skip_reason: 'missing_msclkid' as const,
            status: 'skipped_unqualified' as const
          }
        ]
      }
    }

    return [
      {
        dispatch_mode: 'server_retry' as const,
        event_id: event.event_id,
        provider
      }
    ]
  })
}
