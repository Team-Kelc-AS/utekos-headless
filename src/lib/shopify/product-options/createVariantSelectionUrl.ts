import {
  buildPublicVariantUrl,
  requireProductPresentation,
  resolvePublicVariantOptions
} from '@/lib/products/presentation'

type CreateVariantSelectionUrlInput = {
  handle: string
  selectedOptions: Array<{ name: string; value: string }>
  searchParams: Pick<URLSearchParams, 'toString'>
}

export function createVariantSelectionUrl({
  handle,
  selectedOptions,
  searchParams
}: CreateVariantSelectionUrlInput): string {
  const presentation = requireProductPresentation(handle)
  const options = resolvePublicVariantOptions(
    presentation,
    selectedOptions
  )

  if (!options) {
    throw new Error(
      `Cannot build a public variant URL for ${presentation.productKey}`
    )
  }

  return buildPublicVariantUrl({
    presentation,
    options,
    searchParams
  })
}
