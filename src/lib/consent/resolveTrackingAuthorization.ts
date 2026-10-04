import {
  type ConsentSnapshot
} from '@/lib/analytics/canonicalEventEnvelope'

export const OPERATOR_TRACKING_POLICY_VERSION = '1'

export const OPERATOR_TRACKING_AUTHORIZATION = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'operator_policy',
  version: OPERATOR_TRACKING_POLICY_VERSION
} as const satisfies ConsentSnapshot

export function resolveTrackingAuthorization(
  _ignored?: unknown
): ConsentSnapshot {
  return OPERATOR_TRACKING_AUTHORIZATION
}
