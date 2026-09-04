export const META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS = [
  'primary'
] as const

export const META_CATALOG_DEFAULT_TRACKING_URL_TAGS = [
  'utm_source=meta',
  'utm_medium=paid_social',
  'utm_campaign={{campaign.id}}',
  'utm_id={{campaign.id}}',
  'utm_term={{adset.id}}',
  'utm_content={{ad.id}}'
].join('&')
