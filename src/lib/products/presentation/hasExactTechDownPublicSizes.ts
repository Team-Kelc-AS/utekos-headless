import { TECH_DOWN_PUBLIC_SIZES } from './techDownSizeContract'

/**
 * Validates the public size set, independent of how many colors or other
 * public variants Shopify adds for each size.
 */
export function hasExactTechDownPublicSizes(
  sizes: readonly (string | undefined)[]
): boolean {
  if (sizes.some(size => !size)) return false

  const uniqueSizes = new Set(sizes)

  return (
    uniqueSizes.size === TECH_DOWN_PUBLIC_SIZES.length &&
    TECH_DOWN_PUBLIC_SIZES.every(size => uniqueSizes.has(size))
  )
}