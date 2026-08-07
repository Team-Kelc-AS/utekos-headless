import 'server-only'

import { getCachedRelatedProducts } from '@/api/lib/products/getCachedRelatedProducts'
import { buildProductCardModel } from '@/lib/shopify/buildProductPurchaseModel'
import { RelatedProducts } from './RelatedProducts'

type AsyncRelatedProductsProps = {
  handle: string
}

export async function AsyncRelatedProducts({
  handle
}: AsyncRelatedProductsProps) {
  const relatedProducts =
    await getCachedRelatedProducts(handle)

  if (relatedProducts.length === 0) {
    return null
  }

  const products = relatedProducts.map(
    buildProductCardModel
  )

  return <RelatedProducts products={products} />
}