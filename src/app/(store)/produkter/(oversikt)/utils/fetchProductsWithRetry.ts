import 'server-only'

import {
  fetchProducts,
  getProducts
} from '@/api/lib/products/getProducts'

export async function fetchProductsWithRetry(
  retries = 3,
  delay = 2000
) {
  for (let i = 0; i < retries; i++) {
    try {
      // A retry must reach Shopify even if the first failure is still cached.
      if (i > 0) return await fetchProducts()

      const response = await getProducts()

      if (
        response.success &&
        response.body &&
        response.body.length > 0
      ) {
        return response.body
      }

      throw new Error(
        response.error || 'Empty or failed response'
      )
    } catch (error) {
      if (i === retries - 1) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return []
}
