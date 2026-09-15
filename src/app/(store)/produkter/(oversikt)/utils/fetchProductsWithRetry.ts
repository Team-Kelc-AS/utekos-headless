import 'server-only'

import { getProducts } from '@/api/lib/products/getProducts'

export async function fetchProductsWithRetry(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await getProducts()

      if (response.success && response.body && response.body.length > 0) {
        return response.body
      }

      throw new Error(response.error || 'Empty or failed response')
    } catch (error) {
      if (i === retries - 1) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return []
}
