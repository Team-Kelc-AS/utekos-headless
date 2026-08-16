import 'server-only'

import type { RuntimeCache } from '@vercel/functions'
import { revalidateTag } from 'next/cache'
import { TAGS } from '@/api/constants'
import { RELATED_PRODUCTS_RUNTIME_CACHE_TAG } from '@/api/lib/products/relatedProductsPolicy'
import {
  getShopifyCatalogRuntimeCache,
  normalizeShopifyProductHandle,
  normalizeShopifyProductId
} from '@/lib/cache/shopifyProductRuntimeCache'

type ProductCatalogInvalidationDependencies = {
  runtimeCache?: RuntimeCache
  revalidateNextTag?: typeof revalidateTag
}

export type ProductCatalogInvalidationResult = {
  nextTags: string[]
  runtimeTags: string[]
}

export async function revalidateProductCatalog(
  handles: readonly string[] = [],
  productIds: readonly (string | number)[] = [],
  dependencies: ProductCatalogInvalidationDependencies = {}
): Promise<ProductCatalogInvalidationResult> {
  const tags = new Set<string>([TAGS.products])
  const runtimeTags = new Set<string>([
    'catalog',
    RELATED_PRODUCTS_RUNTIME_CACHE_TAG
  ])

  for (const handle of handles) {
    const normalizedHandle = normalizeShopifyProductHandle(handle)

    if (normalizedHandle) {
      tags.add(`product-${normalizedHandle}`)
      tags.add(`related-products-${normalizedHandle}`)
      runtimeTags.add(`product-handle:${normalizedHandle}`)
      runtimeTags.add(`related-products-handle:${normalizedHandle}`)
    }
  }

  for (const productId of productIds) {
    const normalizedProductId = normalizeShopifyProductId(productId)
    if (normalizedProductId) runtimeTags.add(`product:${normalizedProductId}`)
  }

  const revalidateNextTag = dependencies.revalidateNextTag ?? revalidateTag
  for (const tag of tags) {
    revalidateNextTag(tag, { expire: 0 })
  }

  const runtimeCache = dependencies.runtimeCache ?? getShopifyCatalogRuntimeCache()
  await runtimeCache.expireTag(Array.from(runtimeTags))

  return {
    nextTags: Array.from(tags),
    runtimeTags: Array.from(runtimeTags)
  }
}
