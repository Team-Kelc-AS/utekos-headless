import { queryOptions } from '@tanstack/react-query'
import { COMFYROBE_PRODUCT_HANDLE } from '@/app/(store)/comfyrobe/data/comfyrobeLandingSeo'
import type { ShopifyProduct } from 'types/product'

async function fetchComfyrobeProduct(): Promise<ShopifyProduct | null> {
  const response = await fetch(
    `/api/products/${COMFYROBE_PRODUCT_HANDLE}`
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(
      `Comfyrobe product request failed: ${response.status}`
    )
  }

  return (await response.json()) as ShopifyProduct
}

export const comfyrobeCartDealOptions = queryOptions({
  queryKey: ['products', 'comfyrobe', 'cart-deal'] as const,
  queryFn: fetchComfyrobeProduct,
  staleTime: 5 * 60 * 1000
})
