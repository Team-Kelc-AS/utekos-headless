import { canonicalViewItemSchema } from '../../viewItemEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestViewItemProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'view_item',
    key: 'pinterest:view_item',
    schema: canonicalViewItemSchema
  })
