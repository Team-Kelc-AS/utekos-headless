import type { ProductCardModel } from 'types/product/ProductPurchaseModel'
export function createColorHexMap(
  product: ProductCardModel
): Map<string, string> {
  const map = new Map<string, string>()
  if (!product?.variants?.edges) {
    return map
  }

  for (const edge of product.variants.edges) {
    const variant = edge.node
    const colorOption = variant.selectedOptions.find(
      opt => opt.name.toLowerCase() === 'farge'
    )

    const field = variant.variantProfileData?.swatchHexcolorForVariant
    let colorCode: string | undefined = undefined
    if (
      field
      && typeof field === 'object'
      && !Array.isArray(field)
      && field.value
    ) {
      colorCode = field.value
    }

    if (colorOption?.value && colorCode) {
      if (!map.has(colorOption.value)) {
        map.set(colorOption.value, colorCode)
      }
    }
  }
  return map
}
