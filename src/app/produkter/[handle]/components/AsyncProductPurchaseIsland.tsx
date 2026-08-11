import 'server-only'

import { fetchProductOptions } from '@/api/lib/products/fetchProductOptions'
import { ProductPurchaseIsland } from './ProductPurchaseIsland'
import type { UtekosProductOptions } from '@/lib/shopify/product-options/types'
import type {
  ProductPurchaseModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

type AsyncProductPurchaseIslandProps = {
  product: ProductPurchaseModel
  selectedVariant: ProductPurchaseVariant
  storefrontLookupHandle: string
  storefrontSelectedOptions: Array<{
    name: string
    value: string
  }>
}

export async function AsyncProductPurchaseIsland({
  product,
  selectedVariant,
  storefrontLookupHandle,
  storefrontSelectedOptions
}: AsyncProductPurchaseIslandProps) {
  let productOptions: UtekosProductOptions | null = null
  let hasVariantSelectionError: boolean

  try {
    productOptions = await fetchProductOptions({
      handle: storefrontLookupHandle,
      selectedOptions: storefrontSelectedOptions
    })

    hasVariantSelectionError = productOptions === null
  } catch {
    hasVariantSelectionError = true
  }

  if (!productOptions) {
    productOptions = {
      selectedVariantId: selectedVariant.id,
      selectedVariantAvailableForSale: false,
      options: []
    }
  }

  return (
    <ProductPurchaseIsland
      product={product}
      productOptions={productOptions}
      hasVariantSelectionError={hasVariantSelectionError}
    />
  )
}
