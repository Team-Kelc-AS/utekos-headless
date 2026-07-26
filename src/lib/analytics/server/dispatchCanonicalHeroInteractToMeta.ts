import type { CanonicalHeroInteract } from '../heroInteractEvent'
import { createCanonicalMetaDispatch } from './createCanonicalMetaDispatch'
import { mapCanonicalHeroInteractToMeta } from './mapCanonicalHeroInteractToMeta'

export const dispatchCanonicalHeroInteractToMeta =
  createCanonicalMetaDispatch<CanonicalHeroInteract, 'hero_interact'>({
    eventName: 'hero_interact',
    mapEvent: mapCanonicalHeroInteractToMeta
  })
