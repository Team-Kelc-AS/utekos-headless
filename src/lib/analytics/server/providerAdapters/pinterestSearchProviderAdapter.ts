import { canonicalSearchSchema } from '../../searchEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestSearchProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'search',
    key: 'pinterest:search',
    schema: canonicalSearchSchema
  })
