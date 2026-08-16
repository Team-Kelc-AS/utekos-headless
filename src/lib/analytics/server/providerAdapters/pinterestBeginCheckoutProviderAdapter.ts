import { canonicalBeginCheckoutSchema } from '../../beginCheckoutEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestBeginCheckoutProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'begin_checkout',
    key: 'pinterest:begin_checkout',
    schema: canonicalBeginCheckoutSchema
  })
