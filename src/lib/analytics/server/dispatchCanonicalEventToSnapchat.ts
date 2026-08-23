import type { CanonicalEvent } from '../canonicalEvent'
import {
  hasSnapchatRequiredUserIdentity,
  mapCanonicalEventToSnapchat
} from './mapCanonicalEventToSnapchat'
import {
  sendSnapchatServerEvent,
  type SnapchatSendResult
} from './sendSnapchatServerEvent'
import { resolveSnapchatCutoverAtMs } from './snapchatConversionsApiConfig'
import { classifySnapchatEventFreshness } from './snapchatEventFreshness'

export type SnapchatCanonicalDispatchResult =
  | {
      status: 'skipped'
      reason:
        | 'marketing_consent_not_granted'
        | 'non_production_event'
        | 'unsupported_event'
        | 'missing_snapchat_match_identifier'
        | 'snapchat_event_outside_7d'
        | 'snapchat_before_cutover'
    }
  | SnapchatSendResult

export async function dispatchCanonicalEventToSnapchat(
  event: CanonicalEvent
): Promise<SnapchatCanonicalDispatchResult> {
  if (event.consent.marketing !== 'granted') {
    return {
      status: 'skipped',
      reason: 'marketing_consent_not_granted'
    }
  }

  if (event.environment !== 'production') {
    return { status: 'skipped', reason: 'non_production_event' }
  }

  if (
    classifySnapchatEventFreshness(event.event_time) ===
    'outside_7d'
  ) {
    return {
      status: 'skipped',
      reason: 'snapchat_event_outside_7d'
    }
  }

  const cutoverAtMs = resolveSnapchatCutoverAtMs()
  const eventTimeMs = Date.parse(event.event_time)
  if (
    cutoverAtMs !== undefined &&
    (!Number.isFinite(eventTimeMs) || eventTimeMs < cutoverAtMs)
  ) {
    return {
      status: 'skipped',
      reason: 'snapchat_before_cutover'
    }
  }

  const snapchatEvent = mapCanonicalEventToSnapchat(event)
  if (!snapchatEvent) {
    return { status: 'skipped', reason: 'unsupported_event' }
  }

  if (
    !hasSnapchatRequiredUserIdentity(snapchatEvent.user_data)
  ) {
    return {
      status: 'skipped',
      reason: 'missing_snapchat_match_identifier'
    }
  }

  return sendSnapchatServerEvent(snapchatEvent)
}
