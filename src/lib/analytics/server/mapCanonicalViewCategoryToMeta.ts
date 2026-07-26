import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalViewCategory } from '../viewCategoryEvent'
import { mapCanonicalCustomEventToMeta } from './mapCanonicalCustomEventToMeta'

export function mapCanonicalViewCategoryToMeta(
  event: CanonicalViewCategory
): ServerEvent {
  return mapCanonicalCustomEventToMeta(
    event,
    'ViewCategory',
    event.custom_data
  )
}
