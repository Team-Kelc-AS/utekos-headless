import type { Image } from 'types/media'

export function resolveProductGalleryImages(
  overrideImages: Image[] | undefined,
  fallbackImages: Image[]
): Image[] {
  return overrideImages ?? fallbackImages
}
