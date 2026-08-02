export const metaAdCreativeDestinationSourceKinds = [
  'asset_feed_link_url',
  'object_story_link_data',
  'object_story_template_data',
  'object_story_video_call_to_action',
  'object_url',
  'template_url_spec_web',
  'catalog_product_set',
  'unresolved'
] as const

export type MetaAdCreativeDestinationSourceKind =
  (typeof metaAdCreativeDestinationSourceKinds)[number]

export type MetaAdCreativeDestinationResolutionStatus =
  | 'static'
  | 'template'
  | 'deeplink'
  | 'catalog_dynamic'
  | 'unresolved'

export type MetaAdCreativeDestination = {
  accountId: string
  adCreatedTime: string
  adId: string
  adUpdatedTime: string
  creativeId: string
  destinationFingerprint: string
  destinationUrl: string | null
  dynamicResolutionStatus: MetaAdCreativeDestinationResolutionStatus
  effectiveStatus: string
  normalizedDestinationUrl: string | null
  observedVersion: string
  sourceKind: MetaAdCreativeDestinationSourceKind
  sourcePath: string
  urlTags: string | null
}
