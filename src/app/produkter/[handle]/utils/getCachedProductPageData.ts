import { getProduct } from '@/api/lib/products/getProduct'
import { cacheLife, cacheTag } from 'next/cache'
import { requireProductPresentation } from '@/lib/products/presentation'

export async function getCachedProductPageData(handle: string) {
  'use cache: remote'

  const presentation = requireProductPresentation(handle)

  cacheTag(
    `product-${presentation.storefrontLookupHandle}`,
    'products'
  )
  cacheLife('products')

  const product = await getProduct(
    presentation.storefrontLookupHandle
  )

  return {
    product
  }
}
