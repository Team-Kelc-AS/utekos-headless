import type { Image } from 'types/media'
import type { MetaobjectReference } from 'types/product/MetaobjectReference'

export function computeVariantImages(
  product: { featuredImage: Image | null },
  variant: {
    variantProfileData?: Partial<MetaobjectReference>
  } | null
): Image[] {
  const images = variant?.variantProfileData?.images

  if (Array.isArray(images)) {
    return images
  }

  return product.featuredImage ? [product.featuredImage] : []
}
