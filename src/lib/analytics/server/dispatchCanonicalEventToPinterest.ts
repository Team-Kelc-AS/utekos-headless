import type { CanonicalEvent } from '../canonicalEvent'
import {
  hasPinterestRequiredUserIdentity,
  mapCanonicalEventToPinterest
} from './mapCanonicalEventToPinterest'
import {
  sendPinterestServerEvent,
  type PinterestSendResult
} from './sendPinterestServerEvent'

export type PinterestCanonicalDispatchResult =
  | {
      status: 'skipped'
      reason:
        | 'marketing_consent_not_granted'
        | 'non_production_event'
        | 'unsupported_event'
        | 'insufficient_user_identity'
    }
  | PinterestSendResult

export async function dispatchCanonicalEventToPinterest(
  event: CanonicalEvent
): Promise<PinterestCanonicalDispatchResult> {
  if (event.consent.marketing !== 'granted') {
    return {
      status: 'skipped',
      reason: 'marketing_consent_not_granted'
    }
  }

  if (event.environment !== 'production') {
    return { status: 'skipped', reason: 'non_production_event' }
  }

  const pinterestEvent = mapCanonicalEventToPinterest(event)
  if (!pinterestEvent) {
    return { status: 'skipped', reason: 'unsupported_event' }
  }

  if (
    !hasPinterestRequiredUserIdentity(pinterestEvent.user_data)
  ) {
    return {
      status: 'skipped',
      reason: 'insufficient_user_identity'
    }
  }

  return sendPinterestServerEvent(pinterestEvent)
}
