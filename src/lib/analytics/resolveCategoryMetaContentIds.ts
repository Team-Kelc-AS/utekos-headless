import { cleanShopifyId } from '@/lib/utils/cleanShopifyId'
import { VIEW_CATEGORY_MAX_CONTENT_IDS } from './viewCategoryEvent'

type CategoryProduct = {
  selectedOrFirstAvailableVariant?: { id?: string | null } | null
}

export function resolveCategoryMetaContentIds(
  products: readonly CategoryProduct[],
  limit = VIEW_CATEGORY_MAX_CONTENT_IDS
): string[] {
  const contentIds: string[] = []
  const seen = new Set<string>()

  for (const product of products) {
    const numericId = cleanShopifyId(
      product.selectedOrFirstAvailableVariant?.id
    )?.trim()

    if (!numericId || !/^\d+$/.test(numericId) || seen.has(numericId)) {
      continue
    }

    seen.add(numericId)
    contentIds.push(numericId)
    if (contentIds.length >= limit) break
  }

  return contentIds
}
