import { queryOptions } from '@tanstack/react-query'
import {
  getProductsAction,
  getProductAction
} from '@/api/lib/products/actions'

export const productOptions = (handle: string) =>
  queryOptions({
    queryKey: ['products', handle],
    queryFn: async () => {
      const product = await getProductAction(handle)
      if (!product) {
        throw new Error('Product not found')
      }
      return product
    }
  })

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
