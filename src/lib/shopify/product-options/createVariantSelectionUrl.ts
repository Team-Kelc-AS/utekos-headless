import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'

type CreateVariantSelectionUrlInput = {
  handle: string
  variantId: string
  optionNames: string[]
  searchParams: Pick<URLSearchParams, 'toString'>
}

export function createVariantSelectionUrl({
  handle,
  variantId,
  optionNames,
  searchParams
}: CreateVariantSelectionUrlInput): string {
  const params = new URLSearchParams(searchParams.toString())

  params.delete('variant')

  for (const optionName of optionNames) {
    params.delete(slugifyVariantOption(optionName))
  }

  params.set('variant', variantId)

  return `/produkter/${encodeURIComponent(handle)}?${params.toString()}`
}
