import 'server-only'

import type { RuntimeCache } from '@vercel/functions'
import { revalidateTag } from 'next/cache'
import { TAGS } from '@/api/constants/cacheTags'
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

export type ProductCatalogInvalidationOptions = {
  purgeLastGood?: boolean
}

export async function revalidateProductCatalog(
  handles: readonly string[] = [],
  productIds: readonly (string | number)[] = [],
  options: ProductCatalogInvalidationOptions = {},
  dependencies: ProductCatalogInvalidationDependencies = {}
): Promise<ProductCatalogInvalidationResult> {
  const tags = new Set<string>([TAGS.products])
  const runtimeTags = new Set<string>()
  const normalizedHandles: string[] = []
  const normalizedProductIds: string[] = []

  for (const handle of handles) {
    const normalizedHandle =
      normalizeShopifyProductHandle(handle)

    if (normalizedHandle) {
      normalizedHandles.push(normalizedHandle)
      tags.add(`product-${normalizedHandle}`)
      tags.add(`related-products-${normalizedHandle}`)
      runtimeTags.add(`product-handle:${normalizedHandle}`)
    }
  }

  for (const productId of productIds) {
    const normalizedProductId =
      normalizeShopifyProductId(productId)
    if (normalizedProductId) {
      normalizedProductIds.push(normalizedProductId)
      runtimeTags.add(`product:${normalizedProductId}`)
    }
  }

  if (
    normalizedHandles.length === 0 &&
    normalizedProductIds.length === 0
  ) {
    runtimeTags.add('catalog')
  }

  if (options.purgeLastGood) {
    runtimeTags.add(RELATED_PRODUCTS_RUNTIME_CACHE_TAG)

    if (
      normalizedHandles.length === 0 &&
      normalizedProductIds.length === 0
    ) {
      runtimeTags.add('product-last-good')
    }

    for (const normalizedHandle of normalizedHandles) {
      runtimeTags.add(
        `product-last-good-handle:${normalizedHandle}`
      )
    }

    for (const normalizedProductId of normalizedProductIds) {
      runtimeTags.add(`product-last-good:${normalizedProductId}`)
    }
  }

  const revalidateNextTag =
    dependencies.revalidateNextTag ?? revalidateTag
  for (const tag of tags) {
    // Next 16.3.1 can collapse a prerendered dynamic route to its
    // Suspense fallback after immediate `{ expire: 0 }` invalidation.
    // Keep deletes short-lived until that framework bug is fixed:
    // https://github.com/vercel/next.js/issues/97457
    revalidateNextTag(
      tag,
      options.purgeLastGood ? 'seconds' : 'max'
    )
  }

  const runtimeCache =
    dependencies.runtimeCache ?? getShopifyCatalogRuntimeCache()
  if (runtimeTags.size > 0) {
    await runtimeCache.expireTag(Array.from(runtimeTags))
  }

  return {
    nextTags: Array.from(tags),
    runtimeTags: Array.from(runtimeTags)
  }
}
