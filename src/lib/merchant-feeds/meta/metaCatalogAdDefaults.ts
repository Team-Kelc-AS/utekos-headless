import { META_CATALOG_IMAGE_TAGS } from './metaCatalogImageTags'

export const META_CATALOG_DEFAULT_PREFERRED_IMAGE_TAGS = [
  JSON.stringify({
    DEFAULT: META_CATALOG_IMAGE_TAGS.primary,
    '4_5': META_CATALOG_IMAGE_TAGS.aspectRatio4x5Preferred,
    '9_16': META_CATALOG_IMAGE_TAGS.aspectRatio9x16Preferred
  })
] as const

export const META_CATALOG_DEFAULT_TRACKING_URL_TAGS = [
  'utm_source=meta',
  'utm_medium=paid_social',
  'utm_campaign={{campaign.id}}',
  'utm_id={{campaign.id}}',
  'utm_term={{adset.id}}',
  'utm_content={{ad.id}}',
  'campaign_id={{campaign.id}}',
  'adset_id={{adset.id}}',
  'ad_id={{ad.id}}',
  'placement={{placement}}',
  'site_source_name={{site_source_name}}'
].join('&')
