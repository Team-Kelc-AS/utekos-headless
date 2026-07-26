// Path: src/lib/helpers/normalizers/normalizeProductImage.ts

import type { StorefrontImage } from '@/api/shopify/types/storefrontApi'
import type { Image } from 'types/media'

export const normalizeProductImage = (
  image: Image | StorefrontImage | null,
  fallbackTitle: string
): Image => ({
  url: image?.url ?? '/placeholder-image.png',
  altText: image?.altText ?? `Bilde av ${fallbackTitle}`,
  width: image?.width ?? 1024,
  height: image?.height ?? 1024,
  id: image?.id ?? ''
})
