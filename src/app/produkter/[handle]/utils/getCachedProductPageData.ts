import { getProduct } from '@/api/lib/products/getProduct'
import { cacheLife, cacheTag } from 'next/cache'

export async function getCachedProductPageData(handle: string) {
  'use cache: remote'

  cacheTag(`product-${handle}`, 'products')
  cacheLife('products')

  const product = await getProduct(handle)

  return {
    product
  }
}