import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import type { CanonicalHeroInteract } from '../heroInteractEvent'
import { mapCanonicalCustomEventToMeta } from './mapCanonicalCustomEventToMeta'

export function mapCanonicalHeroInteractToMeta(
  event: CanonicalHeroInteract
): ServerEvent {
  return mapCanonicalCustomEventToMeta(
    event,
    'HeroInteract',
    event.custom_data
  )
}
