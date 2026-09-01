import 'server-only'

import { connection } from 'next/server'
import { fetchProductOptions } from '@/api/lib/products/fetchProductOptions'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
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
  await connection()

  let productOptions: UtekosProductOptions | null = null
  let hasVariantSelectionError: boolean

  try {
    productOptions = await fetchProductOptions({
      handle: storefrontLookupHandle,
      selectedOptions: storefrontSelectedOptions
    })

    hasVariantSelectionError = productOptions === null
  } catch (error) {
    hasVariantSelectionError = true
    reportOperationalError({
      error,
      event: 'pdp.product_purchase_island.failed',
      context: { surface: 'product-purchase-island' }
    })
  }

  if (!productOptions) {
    productOptions = {
      selectedVariantId: selectedVariant.id,
      selectedVariantAvailableForSale: selectedVariant.availableForSale,
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
