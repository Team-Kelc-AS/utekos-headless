export const metaInsightsActionTypes = [
  'landing_page_view',
  'omni_landing_page_view',
  'link_click',
  'add_to_cart',
  'omni_add_to_cart',
  'initiate_checkout',
  'omni_initiated_checkout',
  'purchase',
  'omni_purchase',
  'offsite_conversion.fb_pixel_add_to_cart',
  'offsite_conversion.fb_pixel_initiate_checkout',
  'offsite_conversion.fb_pixel_purchase'
] as const

export type MetaInsightsActionType =
  (typeof metaInsightsActionTypes)[number]
