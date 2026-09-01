import type { PlainDataObject } from 'capi-param-builder-nodejs'
import 'facebook-nodejs-business-sdk'

declare module 'facebook-nodejs-business-sdk' {
  // Matches facebook-nodejs-business-sdk@26.0.1 Preference constructor order:
  // fbc, fbp, client_ip_address, referrer_url, event_source_url.
  export class Preference {
    constructor(
      is_fbc_allowed?: boolean,
      is_fbp_allowed?: boolean,
      is_client_ip_address_allowed?: boolean,
      is_referrer_url_allowed?: boolean,
      is_event_source_url_allowed?: boolean
    )
    isClientIpAddressAllowed(): boolean
    isEventSourceUrlAllowed(): boolean
    isFbcAllowed(): boolean
    isFbpAllowed(): boolean
    isReferrerUrlAllowed(): boolean
  }

  interface ServerEvent {
    setReferrerUrl(referrerUrl: string): ServerEvent
    setRequestContext(
      context: PlainDataObject,
      preference?: Preference | null
    ): ServerEvent
  }
}
