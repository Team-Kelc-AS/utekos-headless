import { TECH_DOWN_PUBLIC_SIZE_DEFINITIONS } from '@/lib/products/techDownSizes'
import type { PublicVariantOptions } from '@/lib/products/productModelSchema'

type SelectableProduct = {
  handle: string
  variants: { id: string; options: PublicVariantOptions }[]
}

export function getDefaultStickySelection(
  products: SelectableProduct[]
) {
  const medium = TECH_DOWN_PUBLIC_SIZE_DEFINITIONS.find(
    size => size.sizeCode === 'M'
  )
  return (
    products
      .find(product => product.handle === 'utekos-techdown')
      ?.variants.find(
        variant => variant.options.size === medium?.size
      )?.id ?? null
  )
}

export function getStickyVariantLabel(
  options: PublicVariantOptions
) {
  return [
    options.color,
    options.size,
    options.gender === 'Unisex' ? undefined : options.gender
  ]
    .filter(Boolean)
    .join(' - ')
}

export function getStickyProductName(
  title: string,
  options: PublicVariantOptions
) {
  return [
    title.replace(/^Utekos\s+/u, '').trim(),
    getStickyVariantLabel(options)
  ]
    .filter(Boolean)
    .join(' ')
}
