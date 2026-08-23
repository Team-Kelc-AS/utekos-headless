import { canonicalViewItemSchema } from '../../viewItemEvent'
import { createSnapchatProviderAdapter } from '../createSnapchatProviderAdapter'

export const snapchatViewItemProviderAdapter =
  createSnapchatProviderAdapter({
    eventName: 'view_item',
    key: 'snapchat:view_item',
    schema: canonicalViewItemSchema
  })
