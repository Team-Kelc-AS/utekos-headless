import { slugifyVariantOption } from '@/lib/utils/slugifyVariantOption'
import type { ProductPresentation } from './getProductPresentation'

import type { PublicVariantOptions } from '../productModelSchema'
import type { SelectedOption } from 'types/product/ProductTypes'
export type { PublicVariantOptions } from '../productModelSchema'
export type ShopifySelectedOption = SelectedOption

function normalizeLookupValue(value: string) {
  return slugifyVariantOption(value).replaceAll('-', ' ')
}

export function resolvePublicOptionValue(
  presentation: ProductPresentation,
  optionName: string,
  rawValue: string
) {
  const normalizedOptionName = normalizeLookupValue(optionName)
  const optionContract = presentation.options.find(option =>
    option.shopifyNames.some(
      shopifyName =>
        normalizeLookupValue(shopifyName) ===
        normalizedOptionName
    )
  )

  if (!optionContract) return null

  const publicValue =
    optionContract.valueMap[normalizeLookupValue(rawValue)] ??
    optionContract.valueMap[rawValue]

  return publicValue ?
      {
        key: optionContract.key,
        publicName: optionContract.publicName,
        publicValue
      }
    : null
}

export function resolvePublicVariantOptions(
  presentation: ProductPresentation,
  selectedOptions: readonly ShopifySelectedOption[]
): PublicVariantOptions | null {
  const resolved: PublicVariantOptions = {}

  for (const optionContract of presentation.options) {
    const shopifyNames = new Set(
      optionContract.shopifyNames.map(normalizeLookupValue)
    )
    const selectedOption = selectedOptions.find(option =>
      shopifyNames.has(normalizeLookupValue(option.name))
    )
    const rawValue =
      selectedOption?.value ?? optionContract.defaultPublicValue

    if (!rawValue) return null

    const mappedValue =
      optionContract.valueMap[normalizeLookupValue(rawValue)] ??
      optionContract.valueMap[rawValue]

    if (!mappedValue) return null

    resolved[optionContract.key] = mappedValue
  }

  return resolved
}

export function isHiddenPublicVariant(
  presentation: ProductPresentation,
  options: PublicVariantOptions
) {
  return presentation.options.some(({ key: optionKey }) => {
    const value = options[optionKey]
    const hiddenValues =
      presentation.hiddenOptionValues[optionKey] ?? []

    return Boolean(value && hiddenValues.includes(value))
  })
}

export function toPublicSelectedOptions(
  presentation: ProductPresentation,
  options: PublicVariantOptions
): ShopifySelectedOption[] {
  return presentation.options.flatMap(optionContract => {
    const value = options[optionContract.key]

    return value ?
        [{ name: optionContract.publicName, value }]
      : []
  })
}
