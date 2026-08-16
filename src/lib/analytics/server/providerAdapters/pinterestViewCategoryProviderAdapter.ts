import { canonicalViewCategorySchema } from '../../viewCategoryEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestViewCategoryProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'view_category',
    key: 'pinterest:view_category',
    schema: canonicalViewCategorySchema
  })
