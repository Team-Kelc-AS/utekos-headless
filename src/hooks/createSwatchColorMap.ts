import type { ProductPurchaseModel } from 'types/product/ProductPurchaseModel'
import type { ShopifyProduct } from 'types/product'

export function createSwatchColorMap(
  product: ProductPurchaseModel | ShopifyProduct | undefined
): Map<string, string> {
  const map = new Map<string, string>()

  if (!product?.variants) return map

  const variants =
    Array.isArray(product.variants) ? product.variants : (
      product.variants.edges.map(edge => edge.node)
    )

  for (const variant of variants) {
    const colorOption = variant.selectedOptions.find(
      option => option.name.toLowerCase() === 'farge'
    )

    const metaColorData = variant.variantProfileData?.swatchHexcolorForVariant

    if (
      colorOption?.value
      && metaColorData
      && typeof metaColorData === 'object'
      && !Array.isArray(metaColorData)
      && metaColorData.value
    ) {
      map.set(colorOption.value, metaColorData.value as string)
    }
  }

  return map
}
