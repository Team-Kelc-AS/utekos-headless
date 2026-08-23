import { canonicalPageViewSchema } from '../../pageViewEvent'
import { createSnapchatProviderAdapter } from '../createSnapchatProviderAdapter'

export const snapchatPageViewProviderAdapter =
  createSnapchatProviderAdapter({
    eventName: 'page_view',
    key: 'snapchat:page_view',
    schema: canonicalPageViewSchema
  })
