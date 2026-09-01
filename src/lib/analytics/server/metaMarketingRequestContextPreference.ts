import { Preference } from 'facebook-nodejs-business-sdk'

/**
 * fbc/fbp are captured and persisted before canonical collection. Provider
 * dispatch must not mint a new browser identity after the canonical event is
 * locked. Request metadata can still be enriched from trusted server context.
 */
export const metaMarketingRequestContextPreference =
  new Preference(false, false, true, true, true)
