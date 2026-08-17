import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

const equivalentPublicOptionSlugGroups: readonly (
  readonly string[]
)[] = [['storre', 'ekstra-stor']]

export function publicOptionSearchParamMatches(
  optionValue: string,
  searchParam: string
) {
  const slug = slugifyVariantOption(optionValue)

  if (slug === searchParam) return true

  return equivalentPublicOptionSlugGroups.some(
    group => group.includes(slug) && group.includes(searchParam)
  )
}
