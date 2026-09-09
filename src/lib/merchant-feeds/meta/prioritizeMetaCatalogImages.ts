import {
  META_CATALOG_IMAGE_PREFERENCE_TAGS,
  META_CATALOG_IMAGE_TAGS
} from './metaCatalogImageTags'
import type { MetaCatalogCuratedImage } from './metaCatalogMediaManifest'
import type { MetaCatalogMediaAsset } from './metaCatalogOffer'

export function prioritizeMetaCatalogImages(
  images: readonly MetaCatalogMediaAsset[],
  curatedImages: readonly MetaCatalogCuratedImage[]
): MetaCatalogMediaAsset[] {
  const replacements = new Map<string, string>()

  for (const image of curatedImages) {
    if (!image.replacePreferences) continue
    for (const preference of image.preferences) {
      for (const tag of META_CATALOG_IMAGE_PREFERENCE_TAGS[
        preference
      ]) {
        const existing = replacements.get(tag)
        if (existing && existing !== image.url) {
          throw new Error(
            `Conflicting Meta catalog primary images for ${tag}`
          )
        }
        replacements.set(tag, image.url)
      }
    }
  }

  const updated = images.map(image => {
    const tags = image.tags.filter(
      tag =>
        !replacements.has(tag) ||
        replacements.get(tag) === image.url
    )
    if (tags.length !== image.tags.length) {
      tags.push(META_CATALOG_IMAGE_TAGS.additional)
    }
    return { url: image.url, tags: [...new Set(tags)] }
  })
  const primaryUrl = replacements.get(
    META_CATALOG_IMAGE_TAGS.primary
  )

  return [
    ...updated.filter(image => image.url === primaryUrl),
    ...updated.filter(image => image.url !== primaryUrl)
  ]
}
