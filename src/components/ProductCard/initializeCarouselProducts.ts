// Path: src/components/ProductCard/initializeCarouselProducts.ts
import type { ProductCardModel } from 'types/product/ProductPurchaseModel'
import { getInitialOptionsForProduct } from './getInitialOptionsForProduct'

export function initializeCarouselProducts(
  products: ProductCardModel[]
): Map<string, Record<string, string>> {
  const usedColors = new Set<string>()
  const productOptions = new Map<string, Record<string, string>>()

  for (const product of products) {
    const options = getInitialOptionsForProduct(product, { usedColors })
    productOptions.set(product.handle, options)

    const selectedColor = options.Farge
    if (selectedColor) {
      usedColors.add(selectedColor)
    }
  }

  return productOptions
}
