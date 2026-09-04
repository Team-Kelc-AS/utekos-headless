import type { MetaCatalogImagePreference } from './metaCatalogImageTags'

export type MetaCatalogCuratedImage = {
  url: string
  preferences: readonly MetaCatalogImagePreference[]
}

type MetaCatalogMediaManifest = {
  images: readonly MetaCatalogCuratedImage[]
  videos: readonly string[]
}

export const META_CATALOG_MEDIA_MANIFEST_BY_HANDLE = {
  comfyrobe: { images: [], videos: [] },
  'utekos-dun': { images: [], videos: [] },
  'utekos-mikrofiber': { images: [], videos: [] },
  'utekos-stapper': { images: [], videos: [] },
  'utekos-techdown': { images: [], videos: [] }
} as const satisfies Record<string, MetaCatalogMediaManifest>
