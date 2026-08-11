import type { Metadata } from 'next'
import { buildMissingProductMetadata } from './buildMissingProductMetadata'
import { buildProductMetadata } from './buildProductMetadata'
import { getCachedProductForMetadata } from './getCachedProductForMetadata'
import { getProductPresentation } from '@/lib/products/presentation'

export async function generateProductMetadata(handle: string): Promise<Metadata> {
  const presentation = getProductPresentation(handle)

  if (!presentation) {
    return buildMissingProductMetadata()
  }

  const product = await getCachedProductForMetadata(
    presentation.storefrontLookupHandle
  )

  if (!product) {
    return buildMissingProductMetadata()
  }

  return buildProductMetadata(product, presentation)
}
