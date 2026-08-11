// src/app/produkter/[handle]/utils/generateProductStaticParams.ts

import { getProducts } from '@/api/lib/products/getProducts'
import { getAllProductPresentations } from '@/lib/products/presentation'

export type ProductStaticParam = {
  handle: string
}

export async function generateProductStaticParams(): Promise<ProductStaticParam[]> {
  const response = await getProducts({ first: 250 })

  if (!response.success || !response.body) {
    throw new Error('Failed to fetch products for generateStaticParams.')
  }

  const liveLookupHandles = new Set(
    response.body
      .map(product => product.handle?.trim())
      .filter((handle): handle is string => Boolean(handle))
  )
  const params = getAllProductPresentations()
    .filter(presentation =>
      liveLookupHandles.has(presentation.storefrontLookupHandle)
    )
    .map(presentation => ({
      handle: presentation.publicHandle
    }))

  if (params.length === 0) {
    throw new Error(
      'generateStaticParams for /produkter/[handle] must return at least one product handle when cacheComponents is enabled.'
    )
  }

  return params
}
