import {
  getProductPresentation,
  type ProductPresentation
} from './getProductPresentation'
import {
  isHiddenPublicVariant,
  resolvePublicVariantOptions,
  type PublicVariantOptions,
  type ShopifySelectedOption
} from './resolvePublicVariantOptions'
import { buildPublicVariantName } from './buildPublicVariantName'
import { buildPublicVariantUrl } from './buildPublicVariantUrl'

export type CatalogVariantPresentationResult =
  | { status: 'missing_product_presentation' }
  | { status: 'invalid_variant_presentation' }
  | { status: 'hidden_public_variant' }
  | {
      status: 'included'
      presentation: ProductPresentation
      options: PublicVariantOptions
      publicName: string
      publicPath: string
      publicUrl: string
    }

export function resolveCatalogVariantPresentation(input: {
  handle: string
  selectedOptions: readonly ShopifySelectedOption[]
}): CatalogVariantPresentationResult {
  const presentation = getProductPresentation(input.handle)

  if (!presentation) {
    return { status: 'missing_product_presentation' }
  }

  const options = resolvePublicVariantOptions(
    presentation,
    input.selectedOptions
  )

  if (!options) {
    return { status: 'invalid_variant_presentation' }
  }

  if (isHiddenPublicVariant(presentation, options)) {
    return { status: 'hidden_public_variant' }
  }

  const publicPath = buildPublicVariantUrl({
    presentation,
    options
  })

  return {
    status: 'included',
    presentation,
    options,
    publicName: buildPublicVariantName(presentation, options),
    publicPath,
    publicUrl: `https://utekos.no${publicPath}`
  }
}
