import 'server-only'

import { getCachedRelatedProducts } from '@/api/lib/products/getCachedRelatedProducts'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import { RelatedProducts } from './RelatedProducts'

type AsyncRelatedProductsProps = {
  handle: string
}

export async function AsyncRelatedProducts({
  handle
}: AsyncRelatedProductsProps) {
  try {
    const products = await getCachedRelatedProducts(handle)

    if (products.length === 0) {
      return null
    }

    return <RelatedProducts products={products} />
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'pdp.related_products.failed',
        level: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        context: {
          handle,
          runtime: getVercelRuntimeContext()
        }
      })
    )
    return null
  }
}
