import 'server-only'

import { connection } from 'next/server'
import { getCachedRelatedProducts } from '@/api/lib/products/getCachedRelatedProducts'
import { getVercelRuntimeContext } from '@/lib/runtime/getVercelRuntimeContext'
import { RelatedProducts } from './RelatedProducts'

type AsyncRelatedProductsProps = {
  handle: string
}

export async function AsyncRelatedProducts({
  handle
}: AsyncRelatedProductsProps) {
  await connection()

  let products: Awaited<
    ReturnType<typeof getCachedRelatedProducts>
  >

  try {
    products = await getCachedRelatedProducts(handle)
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

  if (products.length === 0) {
    return null
  }

  return <RelatedProducts products={products} />
}
