import type { ShopifyProductVariant } from 'types/product'
import { slugifyVariantParam } from './slugifyVariantParam'

export function findVariantFromReadableParams(
  allVariants: ShopifyProductVariant[],
  searchParams: URLSearchParams
) {
  return (
    allVariants.find(variant => {
      const selectedOptions = variant.selectedOptions ?? []
      if (!selectedOptions.length) return false

      return selectedOptions.every(option => {
        const key = slugifyVariantParam(option.name)
        const value = slugifyVariantParam(option.value)

        return searchParams.get(key) === value
      })
    }) ?? null
  )
}
