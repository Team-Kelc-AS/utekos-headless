import { queryOptions } from '@tanstack/react-query'
import type { ShopifyProduct } from 'types/product'

type SuggestionKind = 'accessory' | 'recommended'

export async function fetchProductSuggestions(
  kind: SuggestionKind
): Promise<ShopifyProduct[]> {
  const response = await fetch(`/api/products/suggestions/${kind}`)

  if (!response.ok) {
    throw new Error(
      `Product suggestions request failed: ${response.status}`
    )
  }

  return (await response.json()) as ShopifyProduct[]
}

export const recommendedProductsOptions = queryOptions({
  queryKey: ['products', 'recommended'] as const,
  queryFn: () => fetchProductSuggestions('recommended')
})

export const accessoryProductsOptions = queryOptions({
  queryKey: ['products', 'accessory'] as const,
  queryFn: () => fetchProductSuggestions('accessory')
})
