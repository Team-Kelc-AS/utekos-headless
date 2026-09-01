import 'server-only'

import type { MetaAppData } from '../metaNonWebEventContract'

function booleanFlag(value: boolean) {
  return value ? 1 : 0
}

export function buildMetaExactAppData(
  advertiserTrackingEnabled: boolean,
  appData: MetaAppData
): Record<string, unknown> {
  return {
    advertiser_tracking_enabled: booleanFlag(
      advertiserTrackingEnabled
    ),
    application_tracking_enabled: booleanFlag(
      appData.application_tracking_enabled
    ),
    extinfo: [...appData.extinfo],
    ...(appData.campaign_ids ?
      { campaign_ids: appData.campaign_ids }
    : {}),
    ...(appData.consider_views === undefined ?
      {}
    : { consider_views: appData.consider_views }),
    ...(appData.include_dwell_data === undefined ?
      {}
    : { include_dwell_data: appData.include_dwell_data }),
    ...(appData.include_video_data === undefined ?
      {}
    : { include_video_data: appData.include_video_data }),
    ...(appData.install_referrer ?
      { install_referrer: appData.install_referrer }
    : {}),
    ...(appData.installer_package ?
      { installer_package: appData.installer_package }
    : {}),
    ...(appData.receipt_data ?
      { receipt_data: appData.receipt_data }
    : {}),
    ...(appData.url_schemes ?
      { url_schemes: [...appData.url_schemes] }
    : {}),
    ...(appData.vendor_id ?
      { vendor_id: appData.vendor_id }
    : {}),
    ...(appData.windows_attribution_id ?
      {
        windows_attribution_id:
          appData.windows_attribution_id
      }
    : {})
  }
}
