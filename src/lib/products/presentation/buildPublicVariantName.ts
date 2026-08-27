import type { ProductPresentation } from './getProductPresentation'
import type { PublicVariantOptions } from './resolvePublicVariantOptions'

export function buildPublicVariantName(
  presentation: ProductPresentation,
  options: PublicVariantOptions
) {
  const productAndColor = [
    presentation.displayName,
    options.color
  ].filter((value): value is string => Boolean(value))

  return [productAndColor.join(' '), options.size]
    .filter((value): value is string => Boolean(value))
    .join(' - ')
}

export function buildPublicVariantImageAlt(
  presentation: ProductPresentation,
  options: PublicVariantOptions
) {
  const descriptors = [
    options.color ? `i ${options.color}` : null,
    options.size ? `størrelse ${options.size}` : null,
    options.gender ?? null
  ].filter((value): value is string => Boolean(value))

  return descriptors.length > 0 ?
      `${presentation.media.variantAltPrefix} ${descriptors.join(', ')}.`
    : presentation.media.defaultAlt
}
