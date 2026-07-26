// Path: src/app/produkter/[handle]/components/ProductPageController.tsx

'use client'

import { useProductPage } from '@/hooks/useProductPage'
import { ProductPageControllerView } from './ProductPageControllerView'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type { ShopifyProduct } from 'types/product'

interface ProductPageControllerProps {
  handle: string
  initialRelatedProducts: ShopifyProduct[]
  productOptions: UtekosProductOptions
  hasVariantSelectionError: boolean
}

export function ProductPageController({
  handle,
  initialRelatedProducts,
  productOptions,
  hasVariantSelectionError
}: ProductPageControllerProps) {
  const productPage = useProductPage(
    handle,
    initialRelatedProducts,
    productOptions
  )

  return (
    <ProductPageControllerView
      {...productPage}
      productOptions={productOptions}
      hasVariantSelectionError={hasVariantSelectionError}
    />
  )
}
