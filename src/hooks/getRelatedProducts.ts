// Path: src/hooks/getRelatedProducts.ts

const DEFAULT_FIRST_RELATED_PRODUCT_HANDLE = 'utekos-mikrofiber'
const FIRST_RELATED_PRODUCT_BY_CURRENT_HANDLE: Record<string, string> = {
  'utekos-mikrofiber': 'utekos-techdown'
}

export function getRelatedProducts<T extends { handle: string }>(
  allProducts: T[] | undefined,
  currentHandle: string,
  limit?: number
): T[] {
  if (!allProducts) {
    return []
  }

  const filteredProducts = allProducts.filter(p => p.handle !== currentHandle)
  const firstRelatedProductHandle =
    FIRST_RELATED_PRODUCT_BY_CURRENT_HANDLE[currentHandle] ??
    DEFAULT_FIRST_RELATED_PRODUCT_HANDLE

  const orderedProducts = filteredProducts
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      const aRank = a.product.handle === firstRelatedProductHandle ? 0 : 1
      const bRank = b.product.handle === firstRelatedProductHandle ? 0 : 1

      return aRank - bRank || a.index - b.index
    })
    .map(({ product }) => product)

  return limit ? orderedProducts.slice(0, limit) : orderedProducts
}
