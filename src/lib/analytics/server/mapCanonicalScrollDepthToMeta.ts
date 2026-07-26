import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalScrollDepth } from '../scrollDepthEvent'
import { mapCanonicalCustomEventToMeta } from './mapCanonicalCustomEventToMeta'

export function mapCanonicalScrollDepthToMeta(
  event: CanonicalScrollDepth
): ServerEvent {
  return mapCanonicalCustomEventToMeta(
    event,
    'LandingScrollDepth',
    event.custom_data
  )
}
