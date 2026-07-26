import { canonicalHeroInteractSchema } from '../../heroInteractEvent'
import { createMetaProviderAdapter } from '../createMetaProviderAdapter'
import { dispatchCanonicalHeroInteractToMeta } from '../dispatchCanonicalHeroInteractToMeta'

export const metaHeroInteractProviderAdapter = createMetaProviderAdapter({
  dispatch: dispatchCanonicalHeroInteractToMeta,
  eventName: 'hero_interact',
  key: 'meta:hero_interact',
  schema: canonicalHeroInteractSchema
})
