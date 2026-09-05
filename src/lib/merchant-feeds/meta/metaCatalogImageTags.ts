export const META_CATALOG_IMAGE_TAGS = {
  primary: 'primary',
  additional: 'additional',
  instagramPreferred: 'INSTAGRAM_PREFERRED',
  storyPreferred: 'STORY_PREFERRED',
  reelsPreferred: 'REELS_PREFERRED',
  aspectRatio4x5Preferred: 'ASPECT_RATIO_4_5_PREFERRED',
  aspectRatio9x16Preferred: 'ASPECT_RATIO_9_16_PREFERRED'
} as const

export const META_CATALOG_IMAGE_PREFERENCE_TAGS = {
  default_1_1: [
    META_CATALOG_IMAGE_TAGS.primary,
    META_CATALOG_IMAGE_TAGS.instagramPreferred
  ],
  additional_1_1: [
    META_CATALOG_IMAGE_TAGS.additional,
    META_CATALOG_IMAGE_TAGS.instagramPreferred
  ],
  instagram: [META_CATALOG_IMAGE_TAGS.instagramPreferred],
  feed_4_5: [META_CATALOG_IMAGE_TAGS.aspectRatio4x5Preferred],
  full_screen_9_16: [
    META_CATALOG_IMAGE_TAGS.aspectRatio9x16Preferred
  ],
  stories_9_16: [
    META_CATALOG_IMAGE_TAGS.aspectRatio9x16Preferred,
    META_CATALOG_IMAGE_TAGS.storyPreferred
  ],
  reels_9_16: [
    META_CATALOG_IMAGE_TAGS.aspectRatio9x16Preferred,
    META_CATALOG_IMAGE_TAGS.reelsPreferred
  ]
} as const

export type MetaCatalogImagePreference =
  keyof typeof META_CATALOG_IMAGE_PREFERENCE_TAGS
