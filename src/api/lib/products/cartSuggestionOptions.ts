import { queryOptions } from '@tanstack/react-query'
import { getAccessoryProducts } from './getAccessoryProducts'
import { getRecommendedProducts } from './getRecommendedProducts'

export const recommendedProductsOptions = queryOptions({
  queryKey: ['products', 'recommended'] as const,
  queryFn: getRecommendedProducts
})

export const accessoryProductsOptions = queryOptions({
  queryKey: ['products', 'accessory'] as const,
  queryFn: getAccessoryProducts
})
