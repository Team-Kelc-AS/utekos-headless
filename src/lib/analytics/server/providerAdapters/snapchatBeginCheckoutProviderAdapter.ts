import { canonicalBeginCheckoutSchema } from '../../beginCheckoutEvent'
import { createSnapchatProviderAdapter } from '../createSnapchatProviderAdapter'

export const snapchatBeginCheckoutProviderAdapter =
  createSnapchatProviderAdapter({
    eventName: 'begin_checkout',
    key: 'snapchat:begin_checkout',
    schema: canonicalBeginCheckoutSchema
  })
