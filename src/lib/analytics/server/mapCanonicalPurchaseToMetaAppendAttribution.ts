import 'server-only'

import {
  META_APPEND_ATTRIBUTION_MAX_DELAY_SECONDS,
  getObservedMetaFbcCreationTimestamp,
  metaAppendAttributionEventSchema,
  type MetaAppendAttributionEvent
} from '../metaAppendAttributionContract'
import type { CanonicalPurchase } from '../purchaseEvent'

export const META_LAST_PAID_CLICK_WINDOW_SECONDS =
  7 * 24 * 60 * 60
export const META_LAST_PAID_CLICK_MODEL_VERSION =
  'utekos_last_paid_click_7d_v1' as const

function unixSeconds(value: string) {
  const milliseconds = Date.parse(value)
  return Number.isFinite(milliseconds) ?
      Math.floor(milliseconds / 1000)
    : undefined
}

export function mapCanonicalPurchaseToMetaAppendAttribution(
  event: CanonicalPurchase,
  nowUnixSeconds = Math.floor(Date.now() / 1000)
): MetaAppendAttributionEvent | undefined {
  if (event.consent.marketing !== 'granted') return undefined
  if (event.campaign?.source !== 'meta') return undefined
  if (!event.campaign.ad_id || !/^\d+$/u.test(event.campaign.ad_id)) {
    return undefined
  }
  if (!event.page_url || !event.event_device_info?.user_agent) {
    return undefined
  }

  const fbc = event.browser_id?.fbc
  if (!fbc) return undefined

  const purchaseTime = unixSeconds(event.event_time)
  const touchpointTime = getObservedMetaFbcCreationTimestamp(fbc)
  if (purchaseTime === undefined || touchpointTime === undefined) {
    return undefined
  }
  if (touchpointTime >= purchaseTime) return undefined
  if (
    purchaseTime - touchpointTime >
    META_LAST_PAID_CLICK_WINDOW_SECONDS
  ) {
    return undefined
  }
  if (
    nowUnixSeconds < purchaseTime ||
    nowUnixSeconds - purchaseTime >
      META_APPEND_ATTRIBUTION_MAX_DELAY_SECONDS
  ) {
    return undefined
  }

  return metaAppendAttributionEventSchema.parse({
    action_source: 'website',
    attribution_data: {
      ad_id: event.campaign.ad_id,
      attribution_share: 1,
      attribution_value: event.custom_data.value,
      touchpoint_ts: touchpointTime
    },
    custom_data: { currency: event.custom_data.currency },
    event_id: `${event.event_id}:${META_LAST_PAID_CLICK_MODEL_VERSION}`,
    event_name: 'AppendAttribution',
    event_source_url: event.page_url,
    event_time: nowUnixSeconds,
    marketing_consent: 'granted',
    original_event_data: {
      event_name: 'Purchase',
      event_time: purchaseTime,
      order_id: event.custom_data.transaction_id
    },
    ...(event.referrer_url ?
      { referrer_url: event.referrer_url }
    : {}),
    user_data: {
      client_user_agent: event.event_device_info.user_agent,
      fbc,
      ...(event.browser_id?.fbp ?
        { fbp: event.browser_id.fbp }
      : {}),
      ...(event.client_ip_address ?
        { client_ip_address: event.client_ip_address }
      : {}),
      ...(event.external_id ?
        { external_id: event.external_id }
      : {}),
      ...(event.user_data?.facebook_login_id ?
        { fb_login_id: event.user_data.facebook_login_id }
      : {}),
      ...(event.user_data?.email_sha256 ?
        { email_sha256: event.user_data.email_sha256 }
      : {}),
      ...(event.user_data?.phone_sha256 ?
        { phone_sha256: event.user_data.phone_sha256 }
      : {})
    }
  })
}
