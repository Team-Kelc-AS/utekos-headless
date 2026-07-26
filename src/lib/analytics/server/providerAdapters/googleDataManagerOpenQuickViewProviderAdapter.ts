import { canonicalOpenQuickViewSchema } from '../../openQuickViewEvent'
import { createGoogleDataManagerProviderAdapter } from '../createGoogleDataManagerProviderAdapter'
import { dispatchCanonicalOpenQuickViewToGoogleDataManager } from '../dispatchCanonicalOpenQuickViewToGoogleDataManager'

export const googleDataManagerOpenQuickViewProviderAdapter =
  createGoogleDataManagerProviderAdapter({
    dispatch: dispatchCanonicalOpenQuickViewToGoogleDataManager,
    eventName: 'open_quick_view',
    key: 'google:open_quick_view',
    schema: canonicalOpenQuickViewSchema
  })
