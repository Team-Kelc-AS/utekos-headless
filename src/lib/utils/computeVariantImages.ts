import type { Image } from 'types/media'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

export function computeVariantImages(
  product: { featuredImage: Image | null },
  variant: Pick<
    ProductPurchaseVariant,
    'variantProfileData'
  > | null
): Image[] {
  const images = variant?.variantProfileData?.images

  if (Array.isArray(images)) {
    return images
  }

  return product.featuredImage ? [product.featuredImage] : []
}
