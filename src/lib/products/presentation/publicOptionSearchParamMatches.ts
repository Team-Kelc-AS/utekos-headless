import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'
import {
  TECH_DOWN_PUBLIC_SIZES,
  resolveTechDownSizeValue
} from '../techDownSizes'

export function publicOptionSearchParamMatches(
  optionValue: string,
  searchParam: string
) {
  if (slugifyVariantOption(optionValue) === searchParam)
    return true
  return (
    TECH_DOWN_PUBLIC_SIZES.some(size => size === optionValue) &&
    resolveTechDownSizeValue(searchParam) === optionValue
  )
}
