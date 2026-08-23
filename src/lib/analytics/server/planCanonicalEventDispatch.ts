import type { CanonicalEvent } from '../canonicalEvent'
import {
  getEventCatalogEntry,
  type ProviderId as CatalogProviderId
} from '../eventCatalog'
import type { ProviderId } from './providerAdapter'
import { findGoogleClientId } from './findGoogleClientId'
import { hasMicrosoftUetCapiIdentifier } from './hasMicrosoftUetCapiIdentifier'
import { hasPinterestCanonicalUserIdentity } from './mapCanonicalEventToPinterest'
import { isPinterestConversionsApiConfigured } from './pinterestConversionsApiConfig'
import { hasSnapchatCanonicalUserIdentity } from './mapCanonicalEventToSnapchat'
import {
  isSnapchatConversionsApiEnabled,
  isSnapchatConversionsApiConfigured,
  resolveSnapchatCutoverAtMs
} from './snapchatConversionsApiConfig'
import {
  classifySnapchatEventFreshness,
  type SnapchatEventFreshness
} from './snapchatEventFreshness'
import {
  classifyGoogleDataManagerEventFreshness,
  type GoogleDataManagerEventFreshness
} from './googleDataManagerEventFreshness'
import { resolveMicrosoftUetCapiTokenFromEnv } from './microsoftUetCapiTokenEnvKeys'

type ActiveProviderDispatchIntent = {
  dispatch_mode: 'server_retry'
  event_id: string
  google_event_freshness?: GoogleDataManagerEventFreshness
  snapchat_event_freshness?: SnapchatEventFreshness
  provider: ProviderId
}

type ProviderSkipReason =
  | 'insufficient_pinterest_user_identity'
  | 'missing_capi_token'
  | 'missing_client_id'
  | 'missing_google_analytics_identifier'
  | 'missing_microsoft_uet_identifier'
  | 'missing_snapchat_configuration'
  | 'missing_snapchat_match_identifier'
  | 'google_event_outside_72h'
  | 'snapchat_event_outside_7d'
  | 'snapchat_before_cutover'

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
  'microsoft_uet',
  'pinterest',
  'snapchat'
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
    default: {
      const exhaustive: never = requirement
      return exhaustive
    }
  }
}

export function planCanonicalEventDispatch(
  event: CanonicalEvent,
  dependencies: Dependencies = defaultDependencies
): ProviderDispatchIntent[] {
  const catalogEntry = getEventCatalogEntry(event.event_name)

  if (catalogEntry.lifecycle !== 'active') return []

  return outboxProviderIds.flatMap(
    (provider): ProviderDispatchIntent[] => {
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

        if (!hasMicrosoftUetCapiIdentifier(event)) {
          return [
            {
              dispatch_mode: 'server_retry' as const,
              event_id: event.event_id,
              provider,
              skip_reason:
                'missing_microsoft_uet_identifier' as const,
              status: 'skipped_unqualified' as const
            }
          ]
        }
      }

      if (provider === 'pinterest') {
        if (!isPinterestConversionsApiConfigured()) {
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

        if (!hasPinterestCanonicalUserIdentity(event)) {
          return [
            {
              dispatch_mode: 'server_retry' as const,
              event_id: event.event_id,
              provider,
              skip_reason:
                'insufficient_pinterest_user_identity' as const,
              status: 'skipped_unqualified' as const
            }
          ]
        }
      }

      if (provider === 'snapchat') {
        if (!isSnapchatConversionsApiEnabled()) return []

        const snapchatEventFreshness =
          classifySnapchatEventFreshness(
            event.event_time,
            dependencies.now()
          )
        const baseIntent = {
          dispatch_mode: 'server_retry' as const,
          event_id: event.event_id,
          provider,
          snapchat_event_freshness: snapchatEventFreshness
        }

        if (!isSnapchatConversionsApiConfigured()) {
          return [
            {
              ...baseIntent,
              skip_reason:
                'missing_snapchat_configuration' as const,
              status: 'skipped_unqualified' as const
            }
          ]
        }

        if (snapchatEventFreshness === 'outside_7d') {
          return [
            {
              ...baseIntent,
              skip_reason: 'snapchat_event_outside_7d' as const,
              status: 'skipped_unqualified' as const
            }
          ]
        }

        const cutoverAtMs = resolveSnapchatCutoverAtMs()
        if (
          cutoverAtMs !== undefined &&
          Date.parse(event.event_time) < cutoverAtMs
        ) {
          return [
            {
              ...baseIntent,
              skip_reason: 'snapchat_before_cutover' as const,
              status: 'skipped_unqualified' as const
            }
          ]
        }

        if (!hasSnapchatCanonicalUserIdentity(event)) {
          return [
            {
              ...baseIntent,
              skip_reason:
                'missing_snapchat_match_identifier' as const,
              status: 'skipped_unqualified' as const
            }
          ]
        }

        return [baseIntent]
      }

      return [
        {
          dispatch_mode: 'server_retry' as const,
          event_id: event.event_id,
          provider
        }
      ]
    }
  )
}
