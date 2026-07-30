import { queryOptions } from '@tanstack/react-query'
import { getProductsAction } from '@/api/lib/products/actions'

export const allProductsOptions = () =>
  queryOptions({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const response = await getProductsAction()

      if (!response.success || !response.body) {
        return []
      }

      return response.body
    }
  })
